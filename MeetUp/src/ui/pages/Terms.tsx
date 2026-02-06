import { BgDetails, PageHeader } from "@/components/layout";
import { Link } from "react-router-dom";

export const metadata = { title: "Términos de Servicio" };

export function Terms() {
    return (
        <main className="relative min-h-screen w-full overflow-hidden">
            <BgDetails />

            <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
                <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-10">
                    <section className="w-full max-w-3xl">
                        {/* Header mini */}
                        <PageHeader title="Términos" backHref="/login" forceBackHref />

                        {/* Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                                Términos de Servicio
                            </h1>
                            <p className="mt-2 text-sm text-slate-600">
                                Última actualización: <span className="font-medium">06/02/2026</span>
                            </p>

                            {/* Contenido */}
                            <div className="mt-6 space-y-6 text-sm leading-6 text-slate-700">
                                <p>
                                    Estos Términos de Servicio regulan el acceso y uso de{" "}
                                    <span className="font-medium text-slate-900">Meet Up</span> (la
                                    “Aplicación”). Al usar la Aplicación, aceptas estos términos.
                                </p>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        1. Descripción del servicio
                                    </h2>
                                    <p>
                                        Meet Up permite realizar <span className="font-medium">videollamadas 1:1</span>,
                                        enviar mensajes por chat y gestionar eventos de reuniones mediante integración con
                                        calendario cuando esté disponible.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        2. Cuenta y autenticación
                                    </h2>
                                    <ul className="list-disc space-y-1 pl-5">
                                        <li>Para usar funciones principales, debes iniciar sesión con Google.</li>
                                        <li>Eres responsable de la seguridad de tu cuenta y tu dispositivo.</li>
                                        <li>No debes suplantar identidades ni acceder a cuentas ajenas sin permiso.</li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        3. Uso aceptable
                                    </h2>
                                    <p>No está permitido:</p>
                                    <ul className="list-disc space-y-1 pl-5">
                                        <li>Usar la Aplicación para actividades ilegales o dañinas.</li>
                                        <li>Interferir con su funcionamiento, seguridad o disponibilidad.</li>
                                        <li>Enviar contenido malicioso, spam o acoso.</li>
                                        <li>
                                            Grabar o compartir contenido de una llamada sin consentimiento cuando la ley lo
                                            exija.
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        4. Contenido y comunicaciones
                                    </h2>
                                    <ul className="list-disc space-y-1 pl-5">
                                        <li>Eres responsable del contenido que envías o compartes.</li>
                                        <li>
                                            La Aplicación puede mostrar nombre, avatar y correo de Google para identificación.
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        5. Integraciones (Google Calendar)
                                    </h2>
                                    <p>
                                        Si habilitas la integración con Google Calendar, la Aplicación podrá crear o leer
                                        eventos relacionados con reuniones según los permisos concedidos. Puedes revocar
                                        permisos desde tu cuenta de Google.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        6. Disponibilidad y cambios
                                    </h2>
                                    <p>
                                        Podemos modificar o interrumpir partes del servicio por mantenimiento, mejoras o
                                        seguridad, intentando minimizar el impacto.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        7. Limitación de responsabilidad
                                    </h2>
                                    <p>
                                        La Aplicación se ofrece “tal cual”. No nos hacemos responsables de fallos derivados
                                        de redes, dispositivos o servicios de terceros, en la medida permitida por la ley.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        8. Cancelación
                                    </h2>
                                    <p>
                                        Puedes dejar de usar la Aplicación en cualquier momento. Podemos restringir el acceso
                                        si se incumplen estos términos o por motivos de seguridad.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        9. Contacto
                                    </h2>
                                    <p>
                                        Dudas sobre estos términos:{" "}
                                        <a
                                            className="text-purple-700 hover:underline"
                                            href="mailto:soporte@meetup.com"
                                        >
                                            soporte@meetup.com
                                        </a>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        10. Legislación aplicable
                                    </h2>
                                    <p>
                                        Estos términos se interpretarán conforme a la legislación aplicable en tu
                                        jurisdicción, sin perjuicio de tus derechos como consumidor.
                                    </p>
                                </div>

                                {/* Footer links */}
                                <div className="pt-2 text-xs text-slate-600">
                                    También puedes revisar la{" "}
                                    <Link to="/privacy" className="text-purple-700 hover:underline">
                                        Política de Privacidad
                                    </Link>
                                    .
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}