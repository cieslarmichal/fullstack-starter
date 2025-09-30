import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Heart, Facebook, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      className="bg-slate-800 text-white py-14 mt-auto"
      aria-label="Footer"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:justify-between md:items-start gap-10">
        <div className="col-span-1 md:w-1/3">
          <Link
            to="/"
            className="flex items-center gap-3 mb-4"
          >
            <div className="h-8 w-8 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <h2 className="text-xl font-bold">Monorepo Template</h2>
          </Link>
        </div>

        <div className="col-span-1 md:w-1/3 md:ml-auto md:flex md:justify-end">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-slate-300">
                <Mail className="h-4 w-4 text-teal-400" />
                <a
                  href="mailto:contact@monorepo-template.com"
                  className="hover:text-teal-400 transition-colors"
                >
                  contact@monorepo-template.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Phone className="h-4 w-4 text-teal-400" />
                <a
                  href="tel:+48123456789"
                  className="hover:text-teal-400 transition-colors"
                >
                  +48 123 456 789
                </a>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <MapPin className="h-4 w-4 text-teal-400" />
                <a
                  href="https://maps.google.com/?q=Cracow, Poland"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-400 transition-colors"
                >
                  Cracow, Poland
                </a>
              </div>
              <div className="flex items-center gap-4 pt-3">
                <a
                  href="https://facebook.com/monorepo-template"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="text-slate-300 hover:text-teal-400 transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://instagram.com/monorepo-template"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-slate-300 hover:text-teal-400 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700 mt-10 pt-6 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-300 text-sm">
          <span>© 2025 Monorepo Template. All rights reserved.</span>
          <Heart className="h-4 w-4 text-teal-400" />
        </div>
      </div>
    </footer>
  );
}
