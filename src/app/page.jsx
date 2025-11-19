"use client";

import { useAuth, RedirectToSignIn, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function Home() {
  const { isLoaded, userId, getToken } = useAuth();
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
                Nombre del Proyecto
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase max-w-[400px]">
                Código Alfanumérico
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {pendingUsers.map((author) => {

              return (
                <tr
                  key={author.id}
                  className={`transform transition-transform duration-200 ease-in-out hover:bg-gray-50 hover:scale-[1.02] cursor-pointer`}
                  onClick={() => {
                    window.location.href = `/user/${author.id}`;
                  }}
                >
                  <td className="px-6 py-4 text-gray-500 relative group max-w-[400px] truncate">
                    {author.name}
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
