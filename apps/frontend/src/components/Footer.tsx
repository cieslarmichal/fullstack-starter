import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      className="bg-primary text-primary-foreground py-14 mt-auto border-t border-primary/80"
      aria-label="Footer"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:justify-between md:items-start gap-10 px-4 sm:px-6 lg:px-8">
        <div className="col-span-1 md:w-1/3">
          <Link
            to="/"
            className="flex items-center gap-3 mb-4 group"
          >
            <div className="h-8 w-8 bg-primary-foreground rounded-md flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-primary font-bold text-lg">FS</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Fullstack Starter</h2>
          </Link>
          <p className="text-sm opacity-80 leading-relaxed">
            A modern fullstack starter with everything you need to build production-ready applications. Backend and
            frontend pre-configured and ready to go.
          </p>
        </div>

        <div className="col-span-1 md:w-1/3 md:ml-auto md:flex md:justify-end">
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 opacity-80">
                <Mail className="h-4 w-4" />
                <a
                  href="mailto:contact@fullstack-starter.com"
                  className="hover:opacity-100 transition-opacity"
                >
                  contact@fullstack-starter.com
                </a>
              </div>
              <div className="flex items-center gap-3 opacity-80">
                <Phone className="h-4 w-4" />
                <a
                  href="tel:+48123456789"
                  className="hover:opacity-100 transition-opacity"
                >
                  +48 123 456 789
                </a>
              </div>
              <div className="flex items-center gap-3 opacity-80">
                <MapPin className="h-4 w-4" />
                <a
                  href="https://maps.google.com/?q=Cracow, Poland"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-100 transition-opacity"
                >
                  Cracow, Poland
                </a>
              </div>
              <div className="flex items-center gap-4 pt-3">
                <a
                  href="https://facebook.com/fullstack-starter"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="opacity-80 hover:opacity-100 transition-opacity"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://instagram.com/fullstack-starter"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="opacity-80 hover:opacity-100 transition-opacity"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-primary/80 mt-10 pt-6 text-center px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 opacity-80 text-sm">
          <span>© 2025 Fullstack Starter.</span>
          <span>
            Crafted with ❤️ by{' '}
            <a
              href="https://github.com/cieslarmichal"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-100 underline underline-offset-2 transition-opacity"
            >
              Michał Cieślar
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
