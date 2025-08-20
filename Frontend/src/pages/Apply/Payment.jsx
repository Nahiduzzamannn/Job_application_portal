import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

function Payment() {
  const { subCategoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const paymentData = location.state;

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("credit-card");
  const [selectedMobileBanking, setSelectedMobileBanking] = useState(null);
  const [showMobileBankingOptions, setShowMobileBankingOptions] = useState(false);

  const handleAdmitCard = () => {
    navigate(`/admit-card/${subCategoryId}`);
  };



  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
    if (method !== "net-banking") {
      setShowMobileBankingOptions(false);
      setSelectedMobileBanking(null);
    }
  };

  const toggleMobileBankingOptions = () => {
    setShowMobileBankingOptions(!showMobileBankingOptions);
    if (!showMobileBankingOptions) {
      setSelectedPaymentMethod("net-banking");
    }
  };

  const handleMobileBankingSelect = (method) => {
    setSelectedMobileBanking(method);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Payment Details</h1>
              <p className="text-gray-600">Complete your application process</p>
            </div>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
              Application Fee
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Applicant Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Student Name:</span>
                <span className="font-medium">{paymentData?.studentName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{paymentData?.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Application ID:</span>
                <span className="font-medium">{subCategoryId}</span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Payment Options</h2>
            <div className="space-y-4">
              {/* Credit/Debit Card */}
              <div 
                className="flex items-center p-4 border rounded-lg hover:border-blue-500 cursor-pointer"
                onClick={() => handlePaymentMethodChange("credit-card")}
              >
                <input
                  id="credit-card"
                  name="payment-method"
                  type="radio"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  checked={selectedPaymentMethod === "credit-card"}
                  onChange={() => {}}
                />
                <label htmlFor="credit-card" className="ml-3 block">
                  <span className="flex items-center">
                    <span className="font-medium text-gray-700">Credit/Debit Card</span>
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Recommended
                    </span>
                  </span>
                  <span className="text-sm text-gray-500">Visa, Mastercard</span>
                </label>
              </div>

              {/* Online Banking */}
              <div 
                className="flex items-center p-4 border rounded-lg hover:border-blue-500 cursor-pointer"
                onClick={toggleMobileBankingOptions}
              >
                <input
                  id="net-banking"
                  name="payment-method"
                  type="radio"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  checked={selectedPaymentMethod === "net-banking"}
                  onChange={() => {}}
                />
                <label htmlFor="net-banking" className="ml-3 block">
                  <span className="font-medium text-gray-700">Online Banking</span>
                </label>
              </div>

              {/* Mobile Banking Options - shown when Online Banking is selected */}
              {showMobileBankingOptions && (
                <div className="ml-8 space-y-3">
                  <div 
                    className={`flex items-center p-3 border rounded-lg cursor-pointer ${selectedMobileBanking === "bkash" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                    onClick={() => handleMobileBankingSelect("bkash")}
                  >
                    <input
                      id="bkash"
                      name="mobile-banking"
                      type="radio"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      checked={selectedMobileBanking === "bkash"}
                      onChange={() => {}}
                    />
                    <label htmlFor="bkash" className="ml-3 flex items-center">
                      <img src="https://i.ibb.co/0j7bWXy/bkash.png" alt="Bkash" className="h-6 mr-2" />
                      <span className="font-medium text-gray-700">Bkash</span>
                    </label>
                  </div>

                  <div 
                    className={`flex items-center p-3 border rounded-lg cursor-pointer ${selectedMobileBanking === "nagad" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                    onClick={() => handleMobileBankingSelect("nagad")}
                  >
                    <input
                      id="nagad"
                      name="mobile-banking"
                      type="radio"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      checked={selectedMobileBanking === "nagad"}
                      onChange={() => {}}
                    />
                    <label htmlFor="nagad" className="ml-3 flex items-center">
                      <img src="https://i.ibb.co/0j7bWXy/nagad.png" alt="Nagad" className="h-6 mr-2" />
                      <span className="font-medium text-gray-700">Nagad</span>
                    </label>
                  </div>

                  <div 
                    className={`flex items-center p-3 border rounded-lg cursor-pointer ${selectedMobileBanking === "rocket" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                    onClick={() => handleMobileBankingSelect("rocket")}
                  >
                    <input
                      id="rocket"
                      name="mobile-banking"
                      type="radio"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      checked={selectedMobileBanking === "rocket"}
                      onChange={() => {}}
                    />
                    <label htmlFor="rocket" className="ml-3 flex items-center">
                      <img src="https://i.ibb.co/0j7bWXy/rocket.png" alt="Rocket" className="h-6 mr-2" />
                      <span className="font-medium text-gray-700">Rocket</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Total Amount</h3>
                <p className="text-sm text-gray-600">Inclusive of all taxes</p>
              </div>
              <div className="text-2xl font-bold text-blue-600">500.00TK</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4">
           
            <button
              onClick={handleAdmitCard}
              disabled={selectedPaymentMethod === "net-banking" && !selectedMobileBanking}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                selectedPaymentMethod === "net-banking" && !selectedMobileBanking
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Make Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;