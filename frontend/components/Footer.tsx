import { Newspaper } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Newspaper className="h-8 w-8 text-[#A3B18A]" />
              <span className="text-xl font-bold text-gray-900">Explain the News</span>
            </div>
            <p className="text-gray-600 leading-relaxed max-w-md">
              AI-powered news analysis that helps you understand current events 
              quickly and clearly, with multiple perspectives and bias awareness.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-gray-900">How it works</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Examples</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">API</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-gray-900">About</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Privacy</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Terms</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-12 pt-8 text-center text-gray-500">
          <p>&copy; 2024 Explain the News. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
