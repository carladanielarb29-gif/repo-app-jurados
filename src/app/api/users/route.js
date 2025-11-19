// app/api/users/route.js
import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";

const resend = new Resend('re_C7qXjmfr_3UekieAc6pyDrL1WGFrUWdcd');

export async function GET() {
  const { data, error } = await supabase.from('users2').select('*');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  console.log("Data fetched from Supabase:", data);
  return NextResponse.json(data);
}

export async function POST(req) {
  const { id, nota1, nota2, nota3, notaFinal, modalidad, alph, juradoEmail } = await req.json();

  console.log("Received POST data:", { id, nota1, nota2, nota3, notaFinal, modalidad });

  // Traer el usuario por id
  const { data: userData, error: fetchError } = await supabase
    .from('users2')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (notaFinal !== null) {
    console.log("Enviando email con nota final:", notaFinal);


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

        <h4>📝 Codigo del trabajo: ${alph}</h4>

        <h4>📝 Modalidad del trabajo: ${modalidad}</h4>

        <h4>📝 Email del jurado: ${juradoEmail}</h4>

        <hr style="margin-top:20px; border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #777;">
          Este correo fue generado automáticamente por el sistema de evaluaciones.
        </p>
      </div>
    `
    });
  }

  const updatedUser = {
    nota1: nota1,
    nota2: nota2,
    nota3: nota3,
    notaFinal: notaFinal,
    status: "completed",
  };

  const { error: updateError } = await supabase
    .from('users2')
    .update(updatedUser)
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
