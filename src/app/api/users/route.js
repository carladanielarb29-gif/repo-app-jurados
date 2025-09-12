// app/api/users/route.js
import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";

const resend = new Resend('re_C7qXjmfr_3UekieAc6pyDrL1WGFrUWdcd');

export async function GET() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  console.log("Data fetched from Supabase:", data);
  return NextResponse.json(data);
}

export async function POST(req) {
  const { id, notas1, notas2, notas3, notas4, comentario, notaFinal, modalidad } = await req.json();

  console.log("Received POST data:", { id, notas1, notas2, notas3, notas4, comentario, notaFinal, modalidad });

  // Traer el usuario por id
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (notaFinal !== null) {
    console.log("Enviando email con nota final:", notaFinal);

    const comentariosTotales = [
      ...(userData.comentarios || []),
      ...(comentario ? [comentario] : [])
    ];

    const comentariosHtml = comentariosTotales
      .map((comentario, index) => `
      <p><b>Jurado ${index + 1}:</b> ${comentario?.feedback}</p>
    `)
      .join("");

    await resend.emails.send({
      from: 'evaluacion@resend.dev',
      to: 'c2b2medellin.evaluaciones@upb.edu.co',
      subject: `Evaluación completada - Autor(a): ${userData.name}`,
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #4CAF50;">Evaluación completada ✅</h2>
        <p>Estimado equipo,</p>
        <p>Se ha completado la evaluación del autor(a) <b>${userData.name}</b>.</p>
        
        <h3>📊 Resultado final:</h3>
        <p style="font-size: 16px; color: #000;">
          La nota final obtenida es: 
          <span style="font-weight: bold; color: #4CAF50; font-size: 18px;">
            ${notaFinal}
          </span>
        </p>

        <h3>📝 Comentarios de los jurados:</h3>
        ${comentariosHtml}

        <hr style="margin-top:20px; border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #777;">
          Este correo fue generado automáticamente por el sistema de evaluaciones.
        </p>
      </div>
    `
    });
  }

  const updatedUser = {
    notas1: [...(userData.notas1 || []), ...(notas1 ? [notas1] : [])],
    notas2: [...(userData.notas2 || []), ...(notas2 ? [notas2] : [])],
    notas3: [...(userData.notas3 || []), ...(notas3 ? [notas3] : [])],
    notas4: [...(userData.notas4 || []), ...(notas4 ? [notas4] : [])],
    comentarios: [...(userData.comentarios || []), ...(comentario ? [comentario] : [])],
    notaFinal: notaFinal ?? userData.notaFinal,
    status: notaFinal !== null ? "completed" : userData.status || "pending",
    modalidad: [...(userData.modalidad || []), ...(modalidad ? [modalidad] : [])],
  };

  const { error: updateError } = await supabase
    .from('users')
    .update(updatedUser)
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
