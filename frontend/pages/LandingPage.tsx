import Header from '../components/Header';
import Hero from '../components/Hero';
import TrustStrip from '../components/TrustStrip';
import SeeItInAction from '../components/SeeItInAction';
import Features from '../components/Features';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen grid-bg font-['Inter',system-ui,sans-serif]">
      <Header />
      <Hero />
      <TrustStrip />
      <SeeItInAction />
      <Features />
      <Testimonials />
      <Footer />
    </div>
  );
}
