"use client";

import { ArrowRight, Camera, MessageCircle, Send } from "lucide-react";
import { FormEvent, useState } from "react";

const categories = ["Nuevos Drops", "Remeras", "Pantalones", "Buzos", "Zapatillas"];
const contactInfo = ["+543543304908", "+3543304908", "pandocba@gmail.com", "Av. Mahatma Gandhi 300"];

export default function Footer() {
  const [email, setEmail] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: conectar con la ruta de Suscripcion del backend.
    console.log(email);
  }

  return (
    <footer className="border-t border-gray-200 bg-[#F5F5F5]">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-8 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <section>
            <h2 className="font-epilogue text-lg font-bold text-[#1A1C1C]">PANDO CBA</h2>
            <p className="mt-4 max-w-52 font-manrope text-base text-[#848484]">
              Redefinimos la exclusividad. Drops limitados.
            </p>
          </section>

          <section>
            <h2 className="font-manrope text-xs font-bold uppercase tracking-widest text-black">Categorías</h2>
            <ul className="mt-5 space-y-4">
              {categories.map((category) => (
                <li key={category}>
                  {/* TODO: reemplazar # al crear rutas de categorías. */}
                  <a href="#" className="font-epilogue text-xs uppercase tracking-[-0.3px] text-gray-600 hover:text-black">
                    {category}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-manrope text-xs font-bold uppercase tracking-widest text-black">Info</h2>
            <ul className="mt-5 space-y-4 font-epilogue text-xs uppercase tracking-[-0.3px] text-gray-600">
              {contactInfo.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="font-manrope text-xs font-bold uppercase tracking-widest text-black">Más información</h2>
            <form onSubmit={handleSubmit} className="mt-5 flex border-b border-black">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Correo electrónico"
                aria-label="Correo electrónico para el newsletter"
                className="min-w-0 flex-1 bg-transparent py-2 font-manrope text-xs outline-none placeholder:text-gray-400"
              />
              <button type="submit" aria-label="Suscribirme al newsletter" className="px-1 text-black">
                <ArrowRight size={15} />
              </button>
            </form>
            <div className="mt-6 flex gap-4">
              <a href="#" aria-label="Instagram" className="text-[#1E1E1E]"><Camera size={15} /></a>
              <a href="#" aria-label="Mensajes" className="text-[#1E1E1E]"><MessageCircle size={15} /></a>
              <a href="#" aria-label="Twitter" className="text-[#1E1E1E]"><Send size={15} /></a>
            </div>
          </section>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-gray-300 pt-6 font-epilogue text-xs uppercase tracking-[-0.3px] text-[#848484] sm:flex-row sm:items-center sm:justify-between">
          <p>© Copyright PANDO CBA 2026. Todos los derechos reservados.</p>
          <div className="flex gap-8">
            <a href="#">Términos</a>
            <a href="#">Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
