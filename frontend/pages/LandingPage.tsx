import Hero from '../components/Hero';
import Demo from '../components/Demo';
import Features from '../components/Features';
import TrustStrip from '../components/TrustStrip';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F2] font-['Inter',system-ui,sans-serif]">
      <Hero />
      <TrustStrip />
      <Demo />
      <Features />
      <Testimonials />
      <Footer />
    </div>
  );
}