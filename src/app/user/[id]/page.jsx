"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const juradoEmail = clerkUser?.primaryEmailAddress?.emailAddress || "Anon";

  const userId = parseInt(params.id);
  const [user, setUser] = useState(null);

  const [nota1, setNota1] = useState("");
  const [nota2, setNota2] = useState("");
  const [nota3, setNota3] = useState("");

  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const criteriosNotas = [
    [
      "¿El expositor presenta de manera clara y concisa los objetivos, metodología, resultados y conclusiones del estudio?",
      "¿Se utilizan correctamente los términos técnicos y conceptos propios de la disciplina?",
      "¿El mensaje se presenta de forma coherente de acuerdo con conocimientos generales en el área?"
    ],
    [
      "¿El estudio aborda un tema relevante para el campo de la bioquímica y biología molecular?",
      "¿Los resultados presentados aportan información nueva o relevante para la comunidad científica?"
    ],
    [
      "¿Hay una estructura y un orden lógic y coherente (introducción, metodología, resultados, conclusiones)?",
      "¿El contenido es concreto y usado de forma apropiada?",
      "¿El expositor hizo un manejo de tiempo apropiado?"
    ],
  ];


  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        const foundUser = data.find((u) => u.id === userId);
        setUser(foundUser);
      });
  }, [userId]);

  const calcularNotaFinal = () => {
    if (!nota1 || !nota2 || !nota3) return null;

    const total =
      parseInt(nota1, 10) +
      parseInt(nota2, 10) +
      parseInt(nota3, 10);

    return total;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setDisabled(true);

    const notaFinal = calcularNotaFinal(user);

    const payload = {
      id: userId,
      nota1: parseInt(nota1, 10) || null,
      nota2: parseInt(nota2, 10) || null,
      nota3: parseInt(nota3, 10) || null,
      juradoEmail: juradoEmail,
      notaFinal,
      alph: user.alph,
      modalidad: e.target["tipo-presentacion"].value,
    };

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (res.ok) {
      setMensaje("✅ Autor evaluado correctamente.");
      setTimeout(() => {
        setMensaje(null);
        router.push("/");
      }, 3000);
    } else {
      setMensaje("❌ Error al enviar las notas, por favor intente más tarde.");
      setLoading(false);
      setDisabled(false);
    }
  };

  if (!user)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-700"></div>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto mt-10 p-8 bg-white shadow-lg rounded-2xl space-y-6">
      {mensaje && (
        <div className="bg-green-600 text-white px-4 py-2 rounded-lg text-center mb-4">
          {mensaje}
        </div>
      )}

      <div className="text-gray-700">
        <h1 className="text-2xl font-bold mb-2">
          Nombre del Autor:{" "}
          <span className="text-blue-800">{user.name}</span>
        </h1>
        <p className="mb-2">
          <span className="font-semibold">Código:</span>{" "}
          {user.alph || "No disponible"}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Nombre del proyecto:</span>{" "}
          {user.nombreProyecto || "No disponible"}
        </p>

        <p className="mb-2"><strong>OBSERVACIÓN:</strong> La escala de evaluación en cada criterio va de 0 a 5. No se aceptan números con decimales:</p>
        <ul class=" text-sm text-gray-500 list-disc pl-5 space-y-1">
          <li><strong>(5)</strong> Cumple con todas las características del criterio. Es excepcional.</li>
          <li><strong>(4)</strong> Cumple casi todas las características del criterio. Es muy bueno.</li>
          <li><strong>(3)</strong> Cumple algunas de las características del criterio. Es regular, puede ser mejor.</li>
          <li><strong>(2)</strong> Apenas si cumple un aspecto del criterio. Es insuficiente.</li>
          <li><strong>(0–1)</strong> No cumple con las características del criterio.</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {[
          { label: "Claridad y Exactitud científica (Valoración: 0-5 Puntos)", value: nota1, setter: setNota1 },
          { label: "Relevancia e impacto (Valoración: 0-5 Puntos)", value: nota2, setter: setNota2 },
          { label: "Estructura y organización del formato de presentación (Valoración: 0-5 Puntos)", value: nota3, setter: setNota3 },
        ].map((nota, idx) => (
          <div key={idx}>
            <label className="block font-semibold text-gray-600 mb-1">
              {nota.label}
            </label>

            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-1 mb-2">
              {criteriosNotas[idx].map((criterio, cIdx) => (
                <li key={cIdx}>{criterio}</li>
              ))}
            </ul>

            <input
              type="number"
              value={nota.value}
              onChange={(e) => nota.setter(e.target.value)}
              placeholder="Insertar la nota aquí"
              min="0"
              max="5"
              step="1"
              required
              disabled={disabled}
              className="w-full border rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>
        ))}

        <div>
          <label
            htmlFor="tipo-presentacion"
            className="block font-semibold text-gray-600 mb-1"
          >
            Modalidad
          </label>
          <select
            id="tipo-presentacion"
            name="tipo-presentacion"
            className="block w-full rounded-lg border border-gray-700 bg-white px-4 py-2 text-gray-400 focus:border-blue-500 focus:ring-blue-500"
            defaultValue=""
            required
          >
            <option value="" disabled>
              Selecciona una opción de modalidad
            </option>
            <option value="oral-extendido">Oral extendido</option>
            <option value="oral-corto">Oral corto</option>
            <option value="poster">Póster</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={disabled}
          className={`w-full py-2.5 rounded-lg font-semibold shadow transition ${disabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-700 text-white hover:bg-blue-800"
            }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              Enviando...
            </div>
          ) : (
            "Enviar Notas"
          )}
        </button>
      </form>
    </div>
  );
}
