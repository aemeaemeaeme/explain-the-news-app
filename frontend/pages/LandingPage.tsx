import Hero from '../components/Hero';
import Demo from '../components/Demo';
import Features from '../components/Features';
import TrustStrip from '../components/TrustStrip';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <Demo />
      <Features />
      <Testimonials />
      <Footer />
    </>
  );
}
