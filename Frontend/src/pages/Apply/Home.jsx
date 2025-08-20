import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  

 

  const handleViewJobsClick = () => {
    navigate('/categories'); // Assuming you want to require login to view jobs
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-2xl font-bold text-indigo-600">Madhumati IT</div>
            <div className="flex items-center space-x-8">
              
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Find Your Dream Job</h1>
              <p className="text-xl mb-8 text-indigo-100">
                Madhumati IT connects top talent with leading technology companies. 
                Our platform helps you find the perfect role that aligns with your skills.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={handleViewJobsClick}
                  className="bg-white text-indigo-700 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors"
                >
                  View Jobs
                </button>
               
              </div>
            </div>
            <div>
              <img 
                src="https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
                alt="Happy professionals" 
                className="rounded-lg shadow-xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Madhumati IT?</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We provide the tools and resources to take your career to the next level.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-indigo-600 text-xl font-bold">1</div>
            <h3 className="text-xl font-semibold mb-3">Smart Job Matching</h3>
            <p className="text-gray-600">
              Our platform analyzes your profile and recommends the most relevant job opportunities.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-indigo-600 text-xl font-bold">2</div>
            <h3 className="text-xl font-semibold mb-3">Career Guidance</h3>
            <p className="text-gray-600">
              Get personalized career advice from our team of industry experts.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-indigo-600 text-xl font-bold">3</div>
            <h3 className="text-xl font-semibold mb-3">Salary Insights</h3>
            <p className="text-gray-600">
              Access real-time salary data to negotiate the best compensation.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Find Your Dream Job?</h2>
          <button 
                  onClick={handleViewJobsClick}
                  className="bg-white text-indigo-700 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors"
                >
                  View Now
                </button>
        </div>
      </section>
    </div>
  );
};

export default Home;