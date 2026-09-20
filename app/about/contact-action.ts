"use server";

import { Resend } from "resend";

export type ContactFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendContactMessage(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const msg = String(formData.get("msg") ?? "").trim();
  const honeypot = String(formData.get("company") ?? "").trim();

  if (honeypot) {
    return { status: "success" };
  }

  if (!name || !email || !msg) {
    return { status: "error", message: "Completa todos los campos antes de enviar." };
  }

  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "El correo electrónico no es válido." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;

  if (!apiKey || !to) {
    return { status: "error", message: "El envío de correo no está disponible ahora mismo. Intenta más tarde." };
  }

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from: "Arcade Vault <onboarding@resend.dev>",
      to,
      replyTo: email,
      subject: `Nuevo mensaje de contacto de ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\n${msg}`,
    });

    if (error) {
      return { status: "error", message: "No se pudo enviar el mensaje. Intenta de nuevo." };
    }

    return { status: "success" };
  } catch {
    return { status: "error", message: "No se pudo enviar el mensaje. Intenta de nuevo." };
  }
}
