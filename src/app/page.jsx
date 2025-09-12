"use client";

import { useAuth, RedirectToSignIn, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function Home() {
  const { isLoaded, userId, getToken } = useAuth();
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !userId) return;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const res = await fetch("/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isLoaded, userId, getToken]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!userId) {
    return <RedirectToSignIn />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ⚡ Filtramos los que están en "pending" solamente
  const pendingUsers = users.filter((u) => u.status !== "completed");

  // ⚡ Email del jurado actual desde Clerk
  const currentEmail = user?.primaryEmailAddress?.emailAddress;

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-500">
        Autores pendientes por calificación
      </h1>
      <div className="bg-white shadow rounded-lg">
  <table className="table-fixed divide-y divide-gray-200 w-full">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase max-w-[400px]">
          Nombre Autor
        </th>
        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase max-w-[400px]">
          Correo
        </th>
        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase max-w-[400px]">
          Nombre del Proyecto
        </th>
        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase max-w-[400px]">
          Código Alfanumérico
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-100">
      {pendingUsers.map((author) => {
        const alreadyRated = (author.notas1 || []).some(
          (nota) => nota?.nombreJurado === currentEmail
        );

        return (
          <tr
            key={author.id}
            className={`transform transition-transform duration-200 ease-in-out ${
              alreadyRated
                ? "bg-gray-100 cursor-not-allowed"
                : "hover:bg-gray-50 hover:scale-[1.02] cursor-pointer"
            }`}
            onClick={() => {
              if (!alreadyRated) {
                window.location.href = `/user/${author.id}`;
              }
            }}
          >
            <td className="px-6 py-4 text-gray-500 relative group max-w-[400px] truncate">
              {author.name}
              {alreadyRated && (
                <span className="absolute left-0 bg-gray-800 text-white text-xs rounded px-2 py-1 
                     opacity-0 group-hover:opacity-100 transition whitespace-nowrap
                     after:content-[''] after:absolute after:left-3 after:top-full 
                     after:border-4 after:border-transparent after:border-t-gray-800">
                  Usted ya calificó a este autor
                </span>
              )}
            </td>
            <td className="px-6 py-4 text-gray-500 max-w-[400px] truncate">
              {author.email}
            </td>
            <td className="px-6 py-4 text-gray-500 max-w-[400px] truncate">
              {author.nombreProyecto || "No disponible"}
            </td>
            <td className="px-6 py-4 text-gray-500 max-w-[400px] truncate">
              {author.alph || "No disponible"}
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>

    </div>
  );
}
