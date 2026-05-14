import React, { useState } from 'react';
import { 
  Leaf, 
  ChevronDown, 
  Search,
  LayoutDashboard,
  Map as MapIcon,
  Activity,
  FileText,
  ClipboardList,
  Settings,
  Droplets,
  ThermometerSun,
  Zap,
  ArrowRight,
  Sprout,
  Play,
  ExternalLink,
  Star,
  ArrowLeft,
  Quote,
  Menu,
  X
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = ({ onLogin }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="agrinova-landing">
      <nav className="landing-nav">
        <div className="landing-logo">
          <Leaf fill="#2a4335" color="#2a4335" size={28} />
          <span>Planto</span>
        </div>
        
        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`landing-links ${isMobileMenuOpen ? 'mobile-active' : ''}`}>
          <a href="#home" className="active" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
          <a href="#about" onClick={() => setIsMobileMenuOpen(false)}>About Us</a>
          <a href="#features" className="dropdown" onClick={() => setIsMobileMenuOpen(false)}>Products <ChevronDown size={14} /></a>
          <a href="#testimonials" className="dropdown" onClick={() => setIsMobileMenuOpen(false)}>Resources <ChevronDown size={14} /></a>
          <a href="#cta" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
          
          <div className="landing-auth mobile-only">
            <button className="btn-outline" onClick={onLogin}>Log in</button>
            <button className="btn-primary" onClick={onLogin}>Sign up</button>
          </div>
        </div>
        
        <div className="landing-auth desktop-only">
          <button className="btn-outline" onClick={onLogin}>Log in</button>
          <button className="btn-primary" onClick={onLogin}>Sign up</button>
        </div>
      </nav>

      {/* Hero Wrapper with rounded corners and gradient */}
      <div className="hero-wrapper" id="home">
        <div className="landing-bg-grid"></div>
        
        {/* Hero Content */}
        <div className="hero-container">
          <div className="hero-badge">
            <span className="badge-new">● New feature</span>
            <span className="badge-divider"></span>
            <span className="badge-text">Check out the team dashboard <ArrowRight size={14} /></span>
          </div>
          
          <h1 className="hero-headline">
            Revolutionizing Agriculture with <br/>
            AI Crop Recommendations
          </h1>
          
          <p className="hero-subheadline">
            Analyze soil health, predict the best crops to plant, and maximize<br/>
            your yield with Planto's intelligent recommendation engine.
          </p>
          
          <div className="hero-cta">
            <button className="btn-primary btn-large" onClick={onLogin}>Start Farming Smarter <ArrowRight size={16} /></button>
            <button className="btn-white btn-large">How It Works <LayoutDashboard size={16} /></button>
          </div>
        </div>

        {/* Visual Mockup Section */}
        <div className="mockup-container">
          <div className="mockup-window glass-effect" style={{ padding: 0 }}>
            <video 
              autoPlay 
              muted 
              loop 
              playsInline 
              className="mockup-video"
            >
              <source src="/farm-drone.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section className="about-section" id="about">
        <div className="section-container-wide">
          <div className="about-grid-3">
            {/* Left Column */}
            <div className="about-col col-left">
              <span className="col-label">About us</span>
              <h2 className="col-title">Cultivating Success with <br/> AI Precision</h2>
              <p className="col-desc">
                Planto was founded on a simple belief: crop planning shouldn't be a guessing game. 
                We're committed to leveraging AI and soil data to provide precise crop recommendations, ensuring optimal yields and sustainable farming for everyone.
              </p>
              
              <div className="bar-chart-card glass-effect">
                <div className="bar bar-1"></div>
                <div className="bar bar-2"></div>
                <div className="bar bar-3"></div>
              </div>
            </div>

            {/* Middle Column */}
            <div className="about-col col-middle">
              <div className="wheat-image-wrapper">
                <img src="/wheat-stalk.png" alt="Wheat Stalk" className="wheat-image" />
                <div className="pointer-container">
                  <div className="pointer-dot-group">
                    <div className="pointer-dot-outer"></div>
                    <div className="pointer-dot-inner"></div>
                  </div>
                  <svg className="pointer-svg" width="180" height="120" viewBox="0 0 180 120" fill="none">
                    <path d="M10 10 L80 90 L160 90" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" />
                  </svg>
                  <div className="pointer-label-new">
                    <span className="label-bold">10,000+</span>
                    <span className="label-thin">hectares optimized</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="about-col col-right">
              <div className="col-header-right">
                <span className="col-num">01</span>
              </div>
              <h3 className="col-side-title">Precision crop models deployed across 12+ regions</h3>
              
              <div className="field-grid-card">
                <img src="/precision_agriculture_about_us.png" alt="Field Grid" className="field-grid-image" />
              </div>
              
              <div className="yield-stat-box">
                <div className="yield-value">2.4x</div>
                <div className="yield-label text-right">average<br/>crop yield<br/>increase</div>
              </div>
              
              <div className="col-footer-right">
                <a href="#" className="link-learn">
                  Learn more <Activity size={14} className="icon-link" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="how-it-works-wrapper">
          <div className="landing-bg-grid"></div>
          <div className="how-top-labels">
            <span className="how-label-text">How it works</span>
            <span className="how-label-num">02</span>
          </div>
          
          <div className="how-grid-3">
            {/* Column 1 */}
            <div className="how-col">
              <h2 className="how-main-title">How Planto <br/> Works</h2>
              <div className="how-step-block">
                <h3 className="how-step-title">Data <br/>Integration</h3>
                <div className="how-circle-wrapper small">
                  <img src="/precision_agriculture_about_us.png" alt="Data Integration" className="how-circle-img" />
                  <div className="how-badge-green b1">01</div>
                </div>
                <p className="how-desc-text">
                  Collect essential soil parameters and environmental conditions seamlessly.
                </p>
              </div>
            </div>

            {/* Column 2 */}
            <div className="how-col col-center">
              <div className="how-circle-wrapper medium">
                <img src="/wheat-stalk.png" alt="Nutrient Analysis" className="how-circle-img" />
                <div className="how-badge-green b2">02</div>
              </div>
              <p className="how-desc-text center">
                Analyze nutrient levels, moisture, and texture in real-time.
              </p>
              <h3 className="how-step-title center">Soil Health <br/>Data</h3>
              
              <div className="how-footer-center">
                <div className="btn-play-link">
                  <span className="play-text">See How It Works</span>
                  <div className="play-icon-circle-new">
                    <Play size={16} fill="currentColor" />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3 */}
            <div className="how-col col-right-exact">
              <div className="how-step-block-right">
                <h3 className="how-step-title">AI Recommendation <br/>System</h3>
                <p className="how-desc-text">
                  Receive optimized plans for planting, watering, and fertilizing.
                </p>
                <div className="how-circle-wrapper large">
                  <img src="/precision_agriculture_about_us.png" alt="AI System" className="how-circle-img" />
                  <div className="how-badge-green b3">03</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Features Section */}
      <section className="tech-features-section" id="features">
        <div className="section-container-wide">
          <div className="tech-header">
            <span className="tech-label">Tech Features</span>
            <span className="tech-num">03</span>
          </div>

          <div className="tech-intro-row">
            <h2 className="tech-main-title">Next-Generation AI for <br/> Precision Farming</h2>
            <p className="tech-intro-desc">
              Discover the true potential of your land. Planto's advanced algorithms decode complex soil and climate data, 
              delivering pinpoint-accurate crop recommendations that maximize your yield and profitability.
            </p>
          </div>

          <div className="features-bento-grid">
            {/* Card 1: Smart Analytics */}
            <div className="feature-card card-wide card-smart-analytics">
              <div className="card-content">
                <h3 className="card-title">Intelligent Soil Analysis</h3>
                <p className="card-desc">
                  Unlock deep insights into your soil's composition. Our dynamic dashboard tracks crucial metrics 
                  including NPK levels, moisture, temperature, and pH. Planto transforms this raw data into 
                  actionable intelligence, guiding you toward the perfect crop selection.
                </p>
                <ul className="card-list">
                  <li>Evaluate vital soil metrics (NPK, pH, Moisture)</li>
                  <li>Generate AI-powered crop recommendations</li>
                  <li>Optimize planting strategies for maximum yield</li>
                </ul>
                <button className="btn-primary btn-learn-more">
                  Learn More <ExternalLink size={14} />
                </button>
              </div>
              <div className="card-image-wrapper image-dashboard">
                <img src="/precision_agriculture_about_us.png" alt="Analytics Dashboard" className="feature-img" />
              </div>
            </div>

            {/* Card 2: AI Forecasting */}
            <div className="feature-card card-narrow card-ai-forecasting">
              <div className="card-content">
                <h3 className="card-title">Predictive Crop Modeling</h3>
                <p className="card-desc">
                  Eliminate the guesswork from your planting season. Our advanced forecasting models predict 
                  crop success rates based on live environmental data, helping you plan your harvest with 
                  absolute confidence.
                </p>
                <a href="#" className="card-link">
                  Learn more <ExternalLink size={14} />
                </a>
              </div>
              <div className="card-image-wrapper image-bottom">
                <img src="/precision_agriculture_about_us.png" alt="AI Forecasting" className="feature-img" />
              </div>
            </div>

            {/* Card 3: Mobile App */}
            <div className="feature-card card-narrow card-mobile-app">
              <div className="card-content">
                <h3 className="card-title">On-the-Go Insights</h3>
                <p className="card-desc">
                  Access vital soil analytics and crop predictions from anywhere, anytime. Our intuitive interface 
                  ensures you're always connected to your farm's data, allowing you to make quick, informed 
                  decisions directly from the field.
                </p>
                <a href="#" className="card-link">
                  Learn more <ExternalLink size={14} />
                </a>
              </div>
              <div className="card-image-wrapper image-bottom">
                <img src="/wheat-stalk.png" alt="Mobile App" className="feature-img img-phone" />
              </div>
            </div>

            {/* Card 4: Machine Learning Engine */}
            <div className="feature-card card-wide card-ml-engine">
              <div className="card-content">
                <h3 className="card-title">Adaptive AI Engine</h3>
                <p className="card-desc">
                  An intelligent system that evolves with your land. Planto's machine learning models continuously 
                  train on localized soil data, refining their crop recommendations over time to perfectly match 
                  your farm's unique ecosystem.
                </p>
                <ul className="card-list">
                  <li>Self-optimizing crop prediction models</li>
                  <li>Increased recommendation accuracy with every input</li>
                  <li>Hyper-localized analysis for maximum relevance</li>
                </ul>
                <a href="#" className="card-link">
                  Learn more <ExternalLink size={14} />
                </a>
              </div>
              <div className="card-image-wrapper image-side">
                <img src="/wheat-stalk.png" alt="Machine Learning" className="feature-img" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Section */}
      <section className="data-section" id="data">
        <div className="section-container-wide data-wrapper">
          <div className="landing-bg-grid"></div>
          <div className="data-header">
            <span className="data-label">Data Section</span>
            <span className="data-num">04</span>
          </div>

          <div className="data-content">
            <div className="data-info">
              <h2 className="data-title">Real Impact. Real <br/> Growth.</h2>
              <ul className="impact-list">
                <li>
                  <span className="impact-emoji">💰</span>
                  <span className="impact-text">↑ 28% profit from optimal crop matching</span>
                </li>
                <li>
                  <span className="impact-emoji">🌿</span>
                  <span className="impact-text">↓ 33% reduction in resource waste</span>
                </li>
                <li>
                  <span className="impact-emoji">📈</span>
                  <span className="impact-text">↑ 42% increase in predicted yields</span>
                </li>
              </ul>
            </div>

            <div className="data-visual">
              <div className="chart-container">
                <svg className="impact-chart" viewBox="0 0 800 400" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Area */}
                  <path 
                    d="M0,400 L0,250 C100,150 200,150 300,180 C400,210 500,400 600,200 C700,50 800,100 800,150 L800,400 Z" 
                    fill="url(#chartGradient)" 
                  />
                  
                  {/* Line */}
                  <path 
                    d="M0,250 C100,150 200,150 300,180 C400,210 500,400 600,200 C700,50 800,100 800,150" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="3" 
                  />

                  {/* Vertical dashed lines and dots */}
                  <line x1="300" y1="180" x2="300" y2="400" stroke="#10b981" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />
                  <circle cx="300" cy="180" r="5" fill="white" stroke="#10b981" strokeWidth="2" />
                  
                  <line x1="535" y1="310" x2="535" y2="400" stroke="#10b981" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />
                  <circle cx="535" cy="310" r="5" fill="white" stroke="#10b981" strokeWidth="2" />

                  <line x1="720" y1="120" x2="720" y2="400" stroke="#10b981" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />
                  <circle cx="720" cy="120" r="5" fill="white" stroke="#10b981" strokeWidth="2" />
                </svg>

                {/* Chart Labels */}
                <div className="chart-label label-p1" style={{ left: '38%', top: '35%' }}>+28%</div>
                <div className="chart-label label-t1" style={{ left: '62%', top: '70%' }}>-33%</div>
                <div className="chart-label label-p2" style={{ left: '88%', top: '22%' }}>+42%</div>

                {/* X-Axis Labels */}
                <div className="x-axis">
                  <span>10k</span>
                  <span>11k</span>
                  <span>12k</span>
                  <span>13k</span>
                  <span>14k</span>
                  <span>15k</span>
                  <span>16k</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Farmer Stories Section */}
      <section className="stories-section" id="testimonials">
        <div className="section-container-wide">
          <div className="stories-header">
            <span className="stories-label">Farmer Stories</span>
            <span className="stories-num">05</span>
          </div>

          <div className="stories-intro">
            <h2 className="stories-title">Harvesting Success <br/> with AI</h2>
            <p className="stories-desc">
              From overcoming unpredictable seasons to achieving record-breaking yields, see how 
              Planto's data-driven crop recommendations are transforming farms across the globe.
            </p>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-content">
              <div className="testimonial-top">
                <Quote className="quote-icon" size={40} fill="currentColor" />
                <div className="rating-group">
                  <div className="stars">
                    <Star size={16} fill="#10b981" color="#10b981" />
                    <Star size={16} fill="#10b981" color="#10b981" />
                    <Star size={16} fill="#10b981" color="#10b981" />
                    <Star size={16} fill="#10b981" color="#10b981" />
                    <Star size={16} fill="#10b981" color="#10b981" />
                  </div>
                  <span className="rating-value">5.0</span>
                </div>
              </div>

              <p className="testimonial-text">
                "For years, choosing the right crop felt like a gamble with my changing soil conditions. 
                Once I used Planto's AI recommendations to analyze my field data, I confidently planted a 
                high-yield crop tailored to my exact soil profile. My farm saw a record harvest!"
              </p>

              <div className="testimonial-author">
                <h4 className="author-name">Md. Rafiq</h4>
                <p className="author-title">Farm Owner, Kushtia</p>
              </div>
            </div>

            <div className="testimonial-image-wrapper">
              <img src="/farmer-story.png" alt="Md. Rafiq" className="author-img" />
            </div>
          </div>

          <div className="stories-nav">
            <button className="nav-btn btn-prev">
              <ArrowLeft size={20} />
            </button>
            <button className="nav-btn btn-next">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Meet the Team Section */}
      <section className="team-section" id="team">
        <div className="section-container-wide team-wrapper">
          <div className="landing-bg-grid"></div>
          <div className="team-header">
            <span className="team-label">Meet the Team</span>
            <span className="team-num">06</span>
          </div>

          <div className="team-intro">
            <h2 className="team-title">The Minds Behind Planto</h2>
            <p className="team-subtitle">
              Innovators, scientists, and field experts—united to <br/> shape the future of farming.
            </p>
          </div>

          <div className="team-grid">
            <div className="team-row">
              <div className="team-member">
                <div className="member-image-wrapper">
                  <img src="/yves.webp" alt="Yves MUHIRE" className="member-img" />
                </div>
                <h3 className="member-name">Yves MUHIRE</h3>
                <p className="member-role">Fullstack Developer</p>
              </div>
              
              <div className="team-member">
                <div className="member-image-wrapper">
                  <img src="/florice.jpeg" alt="Florice MUSAFIRI" className="member-img" />
                </div>
                <h3 className="member-name">Florice MUSAFIRI</h3>
                <p className="member-role">AI Developer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="cta">
        <div className="section-container-wide">
          <div className="cta-banner">
            <div className="cta-overlay"></div>
            <div className="cta-content">
              <h2 className="cta-title">Join the Green <br/> Farming Revolution</h2>
              <div className="cta-btns">
                <button className="btn-primary btn-large" onClick={onLogin}>
                  Start Farming Smarter <ExternalLink size={16} />
                </button>
                <button className="btn-white btn-large" onClick={onLogin}>
                  Get a Demo <ExternalLink size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Footer */}
      <footer className="footer-section">
        <div className="section-container-wide">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="landing-logo">
                <Leaf fill="#2a4335" color="#2a4335" size={28} />
                <span>Planto</span>
              </div>
              <div className="footer-contact-info">
                <div className="contact-item">
                  <h5 className="contact-label">Address:</h5>
                  <p className="contact-value">Kigali, Rwanda</p>
                </div>
                <div className="contact-item">
                  <h5 className="contact-label">Contact</h5>
                  <p className="contact-value">support@planto.app</p>
                </div>
              </div>
            </div>

            <div className="footer-links-grid">
              <div className="footer-links-col">
                <h4 className="links-title">Quick Links</h4>
                <ul className="links-list">
                  <li><a href="#home">Home</a></li>
                  <li><a href="#about">About Us</a></li>
                  <li><a href="#how-it-works">How It Works</a></li>
                  <li><a href="#team">Team</a></li>
                </ul>
              </div>
              <div className="footer-links-col">
                <h4 className="links-title">Product</h4>
                <ul className="links-list">
                  <li><a href="#features">Soil Analytics</a></li>
                  <li><a href="#features">AI Forecasting</a></li>
                  <li><a href="#data">Impact Data</a></li>
                  <li><a href="#cta">Pricing</a></li>
                </ul>
              </div>
              <div className="footer-links-col">
                <h4 className="links-title">Company</h4>
                <ul className="links-list">
                  <li><a href="#testimonials">Testimonials</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Blog</a></li>
                  <li><a href="#">Contact Us</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copy">2025 Planto. All Rights Reserved. Design by Team Originative Lab</p>
            <div className="footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookies Settings</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
