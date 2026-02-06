export function NotFound() {
    return (
        <div className="p-6">
            <div className="text-lg font-semibold">404</div>
            <div className="mt-2 text-sm opacity-70">
                {window.location.pathname}
                {window.location.search}
            </div>
        </div>
    );
}
