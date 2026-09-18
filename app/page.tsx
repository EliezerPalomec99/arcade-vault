export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Arcade Vault</h1>
        <p className="text-base opacity-80">
          Es una plataforma para jugar online y competir por la mayor cantidad
          de puntos.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Usa Spec Driven Design</h2>
        <p className="opacity-80">
          Basado en{" "}
          <code className="bg-black/[.05] dark:bg-white/[.06] rounded px-1 py-0.5">
            /spec
          </code>{" "}
          y{" "}
          <code className="bg-black/[.05] dark:bg-white/[.06] rounded px-1 py-0.5">
            /spec-impl
          </code>
          .
        </p>
        <p className="opacity-80">
          Siguiendo las buenas practicas recomendadas aquí:{" "}
          <a
            href="https://github.com/Klerith/fernando-skills"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/Klerith/fernando-skills
          </a>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Skills usadas</h2>
        <pre className="bg-black/[.05] dark:bg-white/[.06] rounded-lg px-4 py-3 text-sm">
          <code>npx skills@latest add Klerith/fernando-skills</code>
        </pre>
      </div>
    </main>
  );
}
