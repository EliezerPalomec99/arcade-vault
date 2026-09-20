"use client";

import { useActionState, useState } from "react";
import { sendContactMessage, type ContactFormState } from "@/app/about/contact-action";

const initialState: ContactFormState = { status: "idle" };

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, initialState);
  const [form, setForm] = useState({ name: "", email: "", msg: "" });
  const [shake, setShake] = useState(false);
  const [dismissedState, setDismissedState] = useState<ContactFormState | null>(null);

  const showSuccess = state.status === "success" && state !== dismissedState;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      e.preventDefault();
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  if (showSuccess) {
    return (
      <div className="terminal-success">
        <div className="term-bar">
          <span className="dot r"></span>
          <span className="dot y"></span>
          <span className="dot g"></span>
          <span className="term-title">VAULT-OS // TERMINAL</span>
        </div>
        <div className="term-body">
          <div className="line">
            <span className="prompt">vault@arcade:~$</span> ./send_message --to=team
          </div>
          <div className="line dim">[OK] Conectando con servidor…</div>
          <div className="line dim">[OK] Validando contenido…</div>
          <div className="line dim">[OK] Transmitiendo paquete…</div>
          <div className="line success">
            &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {form.name.toUpperCase()}.
            <span className="caret">_</span>
          </div>
          <div style={{ marginTop: 18 }}>
            <button
              className="btn ghost"
              type="button"
              onClick={() => {
                setDismissedState(state);
                setForm({ name: "", email: "", msg: "" });
              }}
            >
              ENVIAR OTRO MENSAJE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className={"contact-form" + (shake ? " shake" : "")} action={formAction} onSubmit={handleSubmit}>
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />
      <div className="field">
        <label>NOMBRE</label>
        <input
          name="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="px_kai"
        />
      </div>
      <div className="field">
        <label>CORREO ELECTRÓNICO</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="jugador@vault.gg"
        />
      </div>
      <div className="field">
        <label>MENSAJE</label>
        <textarea
          name="msg"
          rows={5}
          value={form.msg}
          onChange={(e) => setForm({ ...form, msg: e.target.value })}
          placeholder="Cuéntanos qué tienes en mente…"
        ></textarea>
      </div>
      {state.status === "error" && <div className="form-error">{state.message}</div>}
      <button className="btn xl press" type="submit" disabled={pending} style={{ width: "100%" }}>
        {pending ? "▶ ENVIANDO…" : "▶ ENVIAR MENSAJE"}
      </button>
    </form>
  );
}
