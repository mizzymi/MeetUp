import { Link } from "react-router-dom";
import { ArrowRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icons";
import { BgDetails } from "@/components/layout";

export function Login() {
    return (
        <main className="relative min-h-screen w-full overflow-hidden">
            <BgDetails />

            <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
                <section className="flex w-full max-w-md flex-col items-center text-center">
                    <IconBadge
                        icon={Video}
                        tone="logo"
                        variant="soft"
                        className="h-12 w-12 rounded-2xl"
                    />

                    <h1 className="mt-4 text-3xl font-semibold tracking-tight">Bienvenido</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Videollamadas 1:1 con chat y agenda
                    </p>

                    <div className="mt-6">
                        <Button
                            intent="primary"
                            leftIcon={ArrowRight}
                            showRightIcon={false}
                            className="h-10 rounded-lg px-5"
                        >
                            Continuar con Google
                        </Button>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                        Al continuar, aceptas nuestros{" "}
                        <Link to="/terms" className="text-purple-700 hover:underline">
                            Términos de Servicio
                        </Link>{" "}
                        y{" "}
                        <Link to="/privacy" className="text-purple-700 hover:underline">
                            Política de Privacidad
                        </Link>
                        .
                    </p>
                </section>
            </div>
        </main>
    );
}