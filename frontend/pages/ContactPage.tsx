import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Mail, MessageCircle, Users } from 'lucide-react';
import backend from '~backend/client';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Please fill in all fields",
        description: "Name, email, and message are required.",
        variant: "destructive"
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid email address",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await backend.news.contact(formData);
      
      if (response.success) {
        toast({
          title: "Message sent!",
          description: "Thank you for contacting us. We'll get back to you soon.",
        });
        
        setFormData({ name: '', email: '', message: '' });
      } else {
        toast({
          title: "Failed to send message",
          description: response.error || "Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again later or email us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email us",
      description: "Get in touch for support, partnerships, or general inquiries",
      contact: "hello@unspin.news"
    },
    {
      icon: MessageCircle,
      title: "Feedback",
      description: "Help us improve Unspin with your suggestions and ideas",
      contact: "Use the form below"
    },
    {
      icon: Users,
      title: "Media & Press",
      description: "Journalists and researchers interested in our methodology",
      contact: "press@unspin.news"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="headline-font text-4xl sm:text-5xl lg:text-6xl mb-6">
            <span style={{color: 'var(--ink)'}}>Get in</span>{' '}
            <span style={{color: 'var(--sage)'}}>Touch</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions about Unspin? Want to partner with us? We'd love to hear from you.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {contactMethods.map((method, index) => (
            <div key={index} className="bg-white rounded-xl p-6 card-shadow text-center">
              <div 
                className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{backgroundColor: 'var(--sage)'}}
              >
                <method.icon className="h-6 w-6" style={{color: 'var(--olive)'}} />
              </div>
              <h3 className="font-semibold mb-2" style={{color: 'var(--navy)'}}>
                {method.title}
              </h3>
              <p className="text-gray-600 text-sm mb-3">{method.description}</p>
              <p className="text-sm font-medium" style={{color: 'var(--olive)'}}>
                {method.contact}
              </p>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-2xl card-shadow p-8">
          <h2 className="display-font text-2xl mb-6 text-center" style={{color: 'var(--navy)'}}>
            Send us a message
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2" style={{color: 'var(--navy)'}}>
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--olive)] focus:border-transparent outline-none transition-all"
                  placeholder="Your full name"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2" style={{color: 'var(--navy)'}}>
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--olive)] focus:border-transparent outline-none transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2" style={{color: 'var(--navy)'}}>
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--olive)] focus:border-transparent outline-none transition-all resize-none"
                placeholder="Tell us how we can help you..."
                required
              />
            </div>
            
            <div className="text-center">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="btn-blush px-8 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div 
            className="rounded-xl p-6"
            style={{backgroundColor: 'var(--sky)'}}
          >
            <h3 className="font-semibold mb-2" style={{color: 'var(--navy)'}}>
              Response Time
            </h3>
            <p className="text-gray-600 text-sm">
              We typically respond within 24 hours during business days. For urgent technical issues, please email us directly.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}