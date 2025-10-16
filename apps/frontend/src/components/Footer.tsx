import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Heart, Facebook, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      className="bg-black text-white py-14 mt-auto border-t border-gray-800"
      aria-label="Footer"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:justify-between md:items-start gap-10 px-4 sm:px-6 lg:px-8">
        <div className="col-span-1 md:w-1/3">
          <Link
            to="/"
            className="flex items-center gap-3 mb-4 group"
          >
            <div className="h-8 w-8 bg-white rounded-md flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-black font-bold text-lg">FS</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Fullstack Starter</h2>
          </Link>
        </div>

        <div className="col-span-1 md:w-1/3 md:ml-auto md:flex md:justify-end">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-400">
                <Mail className="h-4 w-4 text-white" />
                <a
                  href="mailto:contact@fullstack-starter.com"
                  className="hover:text-white transition-colors"
                >
                  contact@fullstack-starter.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Phone className="h-4 w-4 text-white" />
                <a
                  href="tel:+48123456789"
                  className="hover:text-white transition-colors"
                >
                  +48 123 456 789
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <MapPin className="h-4 w-4 text-white" />
                <a
                  href="https://maps.google.com/?q=Cracow, Poland"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
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
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://instagram.com/fullstack-starter"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 mt-10 pt-6 text-center px-4">
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
          <span>© 2025 Fullstack Starter. All rights reserved.</span>
          <Heart className="h-4 w-4 text-white" />
        </div>
      </div>
    </footer>
  );
}
