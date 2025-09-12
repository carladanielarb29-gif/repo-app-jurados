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
  const [nota4, setNota4] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const criteriosNotas = [
    [
      "¿El resumen presenta de manera clara y concisa los objetivos, metodología, resultados y conclusiones del estudio?",
      "¿El lenguaje utilizado es preciso y adecuado para el campo de la bioquímica y biología molecular?",
      "¿El resumen es fácil de entender para un lector con conocimientos generales en el área?",
    ],
    [
      "¿Los resultados presentados son coherentes con los métodos utilizados y las conclusiones extraídas?",
      "¿Se evitan afirmaciones no justificadas o especulaciones?",
      "¿Se utilizan correctamente los términos técnicos y conceptos propios de la disciplina?"
    ],
    [
      "¿El estudio aborda un tema relevante para el campo de la bioquímica y biología molecular?",
      "¿Los resultados presentados aportan información nueva o relevante para la comunidad científica?",
      "¿Se justifica la importancia del estudio en el contexto del congreso?"
    ],
    [
      "¿El resumen sigue una estructura lógica y coherente (introducción, metodología, resultados, conclusiones)?",
      "¿La información se presenta de forma organizada y fácil de seguir?",
      "¿Se cumplen las directrices específicas del congreso en cuanto a la longitud, formato y contenido del resumen?"
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

  // 👉 función para calcular la nota final SOLO si hay 3 jurados
  const calcularNotaFinal = (user, nuevasNotas) => {
    if (!user) return null;

    const keys = ["notas1", "notas2", "notas3", "notas4"];

    const promedios = keys.map((key) => {
      const existentes = Array.isArray(user[key]) ? [...user[key]] : [];

      // agrega la nueva nota del jurado actual
      if (nuevasNotas[key]) {
        existentes.push(nuevasNotas[key]);
      }

      // si aún hay menos de 3 jurados en esta categoría, no podemos calcular
      if (existentes.length < 3) return null;

      const sum = existentes.reduce((acc, n) => acc + n.puntaje, 0);
      return sum / existentes.length;
    });

    // si alguna categoría todavía no tiene 3 jurados, no calculamos nada
    if (promedios.some((p) => p === null)) return null;

    // la nota final es la SUMA de los 4 promedios
    const total = promedios.reduce((a, b) => a + b, 0);
    return parseFloat(total.toFixed(2));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setDisabled(true);

    const nuevasNotas = {
      notas1: { puntaje: parseFloat(nota1), nombreJurado: juradoEmail },
      notas2: { puntaje: parseFloat(nota2), nombreJurado: juradoEmail },
      notas3: { puntaje: parseFloat(nota3), nombreJurado: juradoEmail },
      notas4: { puntaje: parseFloat(nota4), nombreJurado: juradoEmail },
    };

    // calcular la nota final SOLO si ya hay 3 jurados
    const notaFinal = calcularNotaFinal(user, nuevasNotas);

    const payload = {
      id: userId,
      ...nuevasNotas,
      comentario: { nombreJurado: juradoEmail, feedback: descripcion },
      notaFinal, // será null hasta que llegue el 3er jurado
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
          <span className="font-semibold">Correo:</span> {user.email}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Código:</span>{" "}
          {user.alph || "No disponible"}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Nombre del proyecto:</span>{" "}
          {user.nombreProyecto || "No disponible"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {[
          { label: "Nota Claridad y Concisión", value: nota1, setter: setNota1 },
          { label: "Nota Exactitud Científica", value: nota2, setter: setNota2 },
          { label: "Nota Relevancia", value: nota3, setter: setNota3 },
          { label: "Nota Estructura y Organización", value: nota4, setter: setNota4 },
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
              max="25"
              step="0.1"
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

        <div>
          <label className="block font-semibold text-gray-600 mb-1">
            Comentario
          </label>
          <textarea
            placeholder="Inserte sus comentarios aquí"
            value={descripcion}
            required
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            disabled={disabled}
            className="w-full border rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
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
