import { BgDetails, PageHeader } from "@/components/layout";
import { Link } from "react-router-dom";

export const metadata = { title: "Política de Privacidad" };

export function Privacy() {
    return (
        <main className="relative min-h-screen w-full overflow-hidden">
            <BgDetails />

            <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
                <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-10">
                    <section className="w-full max-w-3xl">
                        {/* Header mini */}
                        <PageHeader title="Privacidad" backHref="/login" forceBackHref />

                        {/* Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                                Política de Privacidad
                            </h1>
                            <p className="mt-2 text-sm text-slate-600">
                                Última actualización: <span className="font-medium">06/02/2026</span>
                            </p>

                            {/* Contenido */}
                            <div className="mt-6 space-y-6 text-sm leading-6 text-slate-700">
                                <p>
                                    Esta Política de Privacidad explica cómo{" "}
                                    <span className="font-medium text-slate-900">Meet Up</span> (“la
                                    Aplicación”) trata la información cuando inicias sesión con Google
                                    y utilizas funciones como videollamadas, chat y agenda.
                                </p>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        1. Datos que recopilamos
                                    </h2>
                                    <ul className="list-disc space-y-1 pl-5">
                                        <li>
                                            <span className="font-medium">Datos de cuenta (Google):</span>{" "}
                                            nombre, email y avatar (según lo que Google permita y tus permisos).
                                        </li>
                                        <li>
                                            <span className="font-medium">Datos de uso:</span> métricas básicas de
                                            navegación/errores para mejorar estabilidad (si las habilitas).
                                        </li>
                                        <li>
                                            <span className="font-medium">Calendario (opcional):</span> información
                                            de eventos relacionada con reuniones (título, fecha/hora, invitados),
                                            solo si autorizas la integración.
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        2. Cámara, micrófono y contenido de llamadas
                                    </h2>
                                    <ul className="list-disc space-y-1 pl-5">
                                        <li>
                                            La Aplicación solicita permisos de cámara y micrófono para realizar
                                            videollamadas.
                                        </li>
                                        <li>
                                            <span className="font-medium">No grabamos</span> llamadas ni audio/vídeo
                                            de forma predeterminada.
                                        </li>
                                        <li>
                                            Si en el futuro se añadiera grabación, se informará explícitamente y se
                                            pedirá consentimiento.
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        3. Chat y mensajes
                                    </h2>
                                    <ul className="list-disc space-y-1 pl-5">
                                        <li>
                                            Los mensajes se usan para habilitar el chat entre participantes de
                                            una reunión.
                                        </li>
                                        <li>
                                            El contenido del chat es responsabilidad de los usuarios.
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        4. Finalidades del tratamiento
                                    </h2>
                                    <p>Usamos los datos para:</p>
                                    <ul className="list-disc space-y-1 pl-5">
                                        <li>Autenticación y gestión de sesión.</li>
                                        <li>Crear/mostrar reuniones y enlaces de acceso.</li>
                                        <li>Integración con calendario cuando la habilitas.</li>
                                        <li>Mejorar rendimiento, seguridad y experiencia de usuario.</li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        5. Base legal
                                    </h2>
                                    <ul className="list-disc space-y-1 pl-5">
                                        <li>
                                            <span className="font-medium">Ejecución del servicio:</span> para
                                            autenticarte y permitir videollamadas/chat.
                                        </li>
                                        <li>
                                            <span className="font-medium">Consentimiento:</span> para permisos de
                                            cámara/micrófono e integración con Calendar.
                                        </li>
                                        <li>
                                            <span className="font-medium">Interés legítimo:</span> seguridad y mejora
                                            del servicio (p. ej., prevención de abuso).
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        6. Compartición con terceros
                                    </h2>
                                    <ul className="list-disc space-y-1 pl-5">
                                        <li>
                                            <span className="font-medium">Google:</span> se usa para inicio de sesión
                                            y, si lo autorizas, acceso a Calendar según permisos.
                                        </li>
                                        <li>
                                            No vendemos tus datos a terceros.
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        7. Conservación
                                    </h2>
                                    <p>
                                        Conservamos los datos el tiempo necesario para prestar el servicio y cumplir
                                        obligaciones legales. Puedes revocar permisos de Google y dejar de usar la
                                        Aplicación en cualquier momento.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        8. Tus derechos
                                    </h2>
                                    <p>
                                        Puedes solicitar acceso, rectificación, supresión y limitación del tratamiento,
                                        así como oponerte cuando aplique. También puedes revocar tu consentimiento para
                                        cámara/micrófono y Calendar desde tu navegador o tu cuenta de Google.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        9. Seguridad
                                    </h2>
                                    <p>
                                        Aplicamos medidas razonables para proteger tus datos. Aun así, ningún sistema es
                                        100% seguro, por lo que te recomendamos mantener tu dispositivo actualizado y tu
                                        cuenta protegida.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        10. Contacto
                                    </h2>
                                    <p>
                                        Para dudas de privacidad:{" "}
                                        <a
                                            className="text-purple-700 hover:underline"
                                            href="mailto:soporte@meetup.com"
                                        >
                                            soporte@meetup.com
                                        </a>
                                    </p>
                                </div>

                                {/* Footer links */}
                                <div className="pt-2 text-xs text-slate-600">
                                    Puedes revisar también los{" "}
                                    <Link to="/terms" className="text-purple-700 hover:underline">
                                        Términos de Servicio
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