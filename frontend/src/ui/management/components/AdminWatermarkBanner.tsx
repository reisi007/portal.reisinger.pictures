import {Link} from 'react-router-dom';
import {useAuth} from '../../../logic/useAuth';
import {useSettings} from '../../../logic/useSettings';

export default function AdminWatermarkBanner() {
    const {user} = useAuth();
    const {watermark} = useSettings();

    // Warnung nur für Admins anzeigen, falls kein SVG existiert
    if (!user?.is_admin) return null;
    if (!watermark || watermark.has_svg) return null;

    return (
        <div
            className="bg-warning text-warning-content p-2 md:p-3 text-center text-sm font-bold flex flex-wrap justify-center items-center gap-2 z-[60] shrink-0 shadow-md">
            <span className="iconify mdi--alert text-xl"></span>
            <span>WICHTIG: Es ist kein SVG-Wasserzeichen hinterlegt! Gäste können aktuell Bilder ungeschützt herunterladen.</span>
            <Link to="/settings"
                  className="underline whitespace-nowrap bg-base-100/20 px-2 py-1 rounded hover:bg-base-100/40 transition-colors">Jetzt
                beheben</Link>
        </div>
    );
}
