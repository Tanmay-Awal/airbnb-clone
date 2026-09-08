'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Listing, PriceQuote, Booking } from '@/types';
import { apiGetListingDetail, apiCalculatePriceBreakdown, apiCreateBooking } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { ArrowLeft, Star, ShieldCheck, Lock, CreditCard, Smartphone, Building2, CheckCircle2, ChevronRight, Sparkles, Calendar, Users, X } from 'lucide-react';

export default function ConfirmAndPayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser, isLoggedIn, setShowLoginModal } = useAuth();
  const { showToast } = useToast();

  const listingId = Number(params?.id);
  const checkIn = searchParams?.get('checkIn') || '';
  const checkOut = searchParams?.get('checkOut') || '';
  const guests = Number(searchParams?.get('guests') || 1);

  const [listing, setListing] = useState<Listing | null>(null);
  const [priceQuote, setPriceQuote] = useState<PriceQuote | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('123');
  const [cardName, setCardName] = useState<string>('Tanmay Gupta');
  const [upiId, setUpiId] = useState<string>('tanmay@upi');

  // Booking Success Modal State with smooth 300ms transition
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [isSuccessModalRendered, setIsSuccessModalRendered] = useState<boolean>(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState<boolean>(false);

  useEffect(() => {
    async function fetchData() {
      if (!listingId || isNaN(listingId)) return;
      try {
        setIsLoading(true);
        const data = await apiGetListingDetail(listingId);
        setListing(data);

        if (checkIn && checkOut) {
          const quote = await apiCalculatePriceBreakdown(data.price_per_night, checkIn, checkOut);
          setPriceQuote(quote);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load listing details', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [listingId, checkIn, checkOut]);

  // Open modal with smooth animation
  const triggerSuccessModal = (booking: Booking) => {
    setConfirmedBooking(booking);
    setIsSuccessModalRendered(true);
    setTimeout(() => {
      setIsSuccessModalVisible(true);
    }, 20);
  };

  // Close modal with smooth animation
  const closeSuccessModal = (redirectPath?: string) => {
    setIsSuccessModalVisible(false);
    setTimeout(() => {
      setIsSuccessModalRendered(false);
      if (redirectPath) {
        router.push(redirectPath);
      }
    }, 300);
  };

  const handleConfirmAndPay = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      showToast('Please log in to complete your payment', 'info');
      return;
    }

    if (!checkIn || !checkOut) {
      showToast('Missing check-in or check-out dates', 'error');
      return;
    }

    try {
      setIsProcessingPayment(true);
      // Simulate brief network payment delay (1.2s) for realistic payment experience
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const newBooking = await apiCreateBooking(
        {
          listing_id: listingId,
          check_in: checkIn,
          check_out: checkOut,
          guests,
        },
        currentUser?.id
      );

      showToast('Payment successful! Reservation confirmed.', 'success');
      triggerSuccessModal(newBooking);
    } catch (err: any) {
      showToast(err.message || 'Payment processing failed. Please try again.', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading || !listing) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1A1A1A] flex flex-col">
        <Navbar />
        <div className="max-w-[1120px] mx-auto w-full px-6 py-12 animate-pulse space-y-6">
          <div className="h-8 w-1/3 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-6">
              <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
              <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
            </div>
            <div className="lg:col-span-5">
              <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cover image helper
  const coverImage = listing.images && listing.images.length > 0
    ? listing.images[0].url
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

  // Format cancellation date (7 days before checkIn)
  const cancellationDateStr = checkIn
    ? new Date(new Date(checkIn).getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })
    : 'Oct 8';

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] flex flex-col text-airbnb-black dark:text-gray-100 transition-colors duration-200">
      <Navbar />

      <main className="max-w-[1120px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Page Title & Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full border border-airbnb-border dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-airbnb-black dark:text-white" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-airbnb-black dark:text-white tracking-tight">
            Confirm and pay
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT COLUMN: Payment Steps matching user screenshot */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Step 1: Log in or sign up */}
            <div className="border border-airbnb-border dark:border-gray-800 rounded-3xl p-6 bg-white dark:bg-[#1A1A1A] shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-bold text-airbnb-black dark:text-white">1. Logged in</div>
                  <div className="text-xs text-airbnb-grey dark:text-gray-400 mt-0.5">
                    {currentUser ? `Signed in as ${currentUser.name} (${currentUser.email})` : 'You are logged in'}
                  </div>
                </div>
              </div>

              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                Completed
              </span>
            </div>

            {/* Step 2: Add a payment method */}
            <div className="border border-airbnb-border dark:border-gray-800 rounded-3xl p-6 bg-white dark:bg-[#1A1A1A] shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-airbnb-black dark:text-white">2. Select payment method</h2>
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>

              {/* Payment Type Switcher Tabs */}
              <div className="grid grid-cols-3 gap-2 mb-6 bg-gray-100 dark:bg-[#262626] p-1.5 rounded-2xl">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-white dark:bg-[#1F1F1F] text-airbnb-black dark:text-white shadow-xs'
                      : 'text-airbnb-grey dark:text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Card</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'bg-white dark:bg-[#1F1F1F] text-airbnb-black dark:text-white shadow-xs'
                      : 'text-airbnb-grey dark:text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>UPI / GPay</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'netbanking'
                      ? 'bg-white dark:bg-[#1F1F1F] text-airbnb-black dark:text-white shadow-xs'
                      : 'text-airbnb-grey dark:text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Net Banking</span>
                </button>
              </div>

              {/* Card Inputs */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-airbnb-grey dark:text-gray-400 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="1234 5678 9101 1121"
                      className="w-full px-4 py-3 rounded-2xl border border-airbnb-border dark:border-gray-700 bg-white dark:bg-[#262626] text-sm text-airbnb-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-airbnb-grey dark:text-gray-400 mb-1">
                        Expiration
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 rounded-2xl border border-airbnb-border dark:border-gray-700 bg-white dark:bg-[#262626] text-sm text-airbnb-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-airbnb-grey dark:text-gray-400 mb-1">
                        CVV
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="123"
                        className="w-full px-4 py-3 rounded-2xl border border-airbnb-border dark:border-gray-700 bg-white dark:bg-[#262626] text-sm text-airbnb-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-airbnb-grey dark:text-gray-400 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Name on card"
                      className="w-full px-4 py-3 rounded-2xl border border-airbnb-border dark:border-gray-700 bg-white dark:bg-[#262626] text-sm text-airbnb-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white font-medium"
                    />
                  </div>
                </div>
              )}

              {/* UPI Inputs */}
              {paymentMethod === 'upi' && (
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-airbnb-grey dark:text-gray-400 mb-1">
                    Virtual Payment Address (VPA)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@upi or mobile@paytm"
                    className="w-full px-4 py-3 rounded-2xl border border-airbnb-border dark:border-gray-700 bg-white dark:bg-[#262626] text-sm text-airbnb-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white font-medium"
                  />
                  <p className="text-xs text-airbnb-grey dark:text-gray-400">
                    A payment request will be sent to your UPI app (Google Pay, PhonePe, Paytm).
                  </p>
                </div>
              )}

              {/* Net Banking Options */}
              {paymentMethod === 'netbanking' && (
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-airbnb-grey dark:text-gray-400 mb-1">
                    Select Bank
                  </label>
                  <select className="w-full px-4 py-3 rounded-2xl border border-airbnb-border dark:border-gray-700 bg-white dark:bg-[#262626] text-sm text-airbnb-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white font-medium">
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>State Bank of India (SBI)</option>
                    <option>Axis Bank</option>
                    <option>Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}
            </div>

            {/* Step 3: Proceed to payment */}
            <div className="border border-airbnb-border dark:border-gray-800 rounded-3xl p-6 bg-white dark:bg-[#1A1A1A] shadow-xs">
              <h2 className="text-lg font-bold text-airbnb-black dark:text-white mb-2">3. Proceed to payment</h2>
              <p className="text-xs text-airbnb-grey dark:text-gray-400 leading-relaxed mb-6">
                By selecting the button below, I agree to the Host's House Rules, Ground rules for guests, and Airbnb's Rebooking and Refund Policy.
              </p>

              <button
                onClick={handleConfirmAndPay}
                disabled={isProcessingPayment}
                className="w-full py-4 bg-gradient-to-r from-[#E81948] to-[#FF385C] hover:from-[#D70466] hover:to-[#E00B41] text-white font-bold text-base rounded-2xl transition-all transform active:scale-[0.99] shadow-lg shadow-airbnb-red/20 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Confirm and Pay · ₹{priceQuote ? priceQuote.total_price.toLocaleString('en-IN') : listing.price_per_night.toLocaleString('en-IN')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Listing Preview & Price Details Card matching user screenshot */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="border border-airbnb-border dark:border-gray-800 rounded-3xl p-6 shadow-md bg-white dark:bg-[#1A1A1A] flex flex-col gap-6">
              
              {/* Listing Image & Title Card */}
              <div className="flex gap-4 items-center">
                <img
                  src={coverImage}
                  alt={listing.title}
                  className="w-24 h-24 rounded-2xl object-cover flex-shrink-0 shadow-xs border border-airbnb-border dark:border-gray-800"
                />
                <div className="flex flex-col gap-1">
                  <div className="text-xs font-semibold text-airbnb-grey dark:text-gray-400 capitalize">
                    {listing.property_type || 'Entire Villa'}
                  </div>
                  <h3 className="font-bold text-sm text-airbnb-black dark:text-white line-clamp-2 leading-snug">
                    {listing.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs font-semibold text-airbnb-black dark:text-gray-200 mt-1">
                    <Star className="w-3.5 h-3.5 fill-airbnb-black dark:fill-white text-airbnb-black dark:text-white" />
                    <span>{listing.rating ? listing.rating.toFixed(1) : '5.0'}</span>
                    <span className="text-airbnb-grey dark:text-gray-400">({listing.review_count || 3})</span>
                  </div>
                </div>
              </div>

              {/* Free Cancellation Banner */}
              <div className="border-t border-b border-airbnb-border dark:border-gray-800 py-4 flex flex-col gap-1">
                <div className="text-xs font-bold text-airbnb-black dark:text-white flex items-center gap-2">
                  <span>Free cancellation</span>
                </div>
                <div className="text-xs text-airbnb-grey dark:text-gray-400">
                  Cancel before {cancellationDateStr} for a full refund.
                </div>
              </div>

              {/* Trip Dates & Guests Info */}
              <div className="border-b border-airbnb-border dark:border-gray-800 pb-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-airbnb-black dark:text-white">Dates</div>
                    <div className="text-xs text-airbnb-grey dark:text-gray-400 mt-0.5">
                      {checkIn && checkOut ? `${checkIn} → ${checkOut}` : 'Dates selected'}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/listings/${listingId}?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${guests}&openCalendar=true`)}
                    className="px-3 py-1.5 rounded-full border border-airbnb-border dark:border-gray-700 hover:border-black dark:hover:border-white text-xs font-bold text-airbnb-black dark:text-white cursor-pointer transition-colors"
                  >
                    Change
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-airbnb-black dark:text-white">Guests</div>
                    <div className="text-xs text-airbnb-grey dark:text-gray-400 mt-0.5">
                      {guests} guest{guests > 1 ? 's' : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/listings/${listingId}?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${guests}&openGuests=true`)}
                    className="px-3 py-1.5 rounded-full border border-airbnb-border dark:border-gray-700 hover:border-black dark:hover:border-white text-xs font-bold text-airbnb-black dark:text-white cursor-pointer transition-colors"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Price Details Breakdown */}
              <div className="flex flex-col gap-3 text-xs text-airbnb-black dark:text-gray-200">
                <div className="text-sm font-bold text-airbnb-black dark:text-white mb-1">Price details</div>
                
                {priceQuote ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-airbnb-grey dark:text-gray-400">
                        {priceQuote.nights} night{priceQuote.nights > 1 ? 's' : ''} × ₹{priceQuote.price_per_night.toLocaleString('en-IN')}
                      </span>
                      <span className="font-semibold">₹{priceQuote.base_price.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-airbnb-grey dark:text-gray-400">Cleaning fee</span>
                      <span className="font-semibold">₹{priceQuote.cleaning_fee.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-airbnb-grey dark:text-gray-400">Airbnb service fee</span>
                      <span className="font-semibold">₹{priceQuote.service_fee.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="border-t border-airbnb-border dark:border-gray-800 pt-3 mt-1 flex justify-between items-center text-sm font-extrabold text-airbnb-black dark:text-white">
                      <span>Total (INR)</span>
                      <span>₹{priceQuote.total_price.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center font-bold text-sm">
                    <span>Total (INR)</span>
                    <span>₹{listing.price_per_night.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* WORLD-CLASS BOOKING SUCCESSFUL MODAL WITH SMOOTH FADE & SCALE ANIMATION */}
      {isSuccessModalRendered && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300 ${
            isSuccessModalVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div
            className={`bg-white dark:bg-[#1F1F1F] rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-airbnb-border dark:border-gray-800 relative transition-all duration-300 transform ${
              isSuccessModalVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
            }`}
          >
            {/* Close Icon */}
            <button
              onClick={() => closeSuccessModal('/trips')}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-airbnb-grey dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Confetti & Success Check Badge Header */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6 animate-bounce">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Payment Confirmed</span>
              </div>

              <h2 className="text-2xl font-extrabold text-airbnb-black dark:text-white tracking-tight mb-2">
                Booking Successful! 🎉
              </h2>
              <p className="text-xs text-airbnb-grey dark:text-gray-400 max-w-sm mb-6">
                Your reservation at <span className="font-bold text-airbnb-black dark:text-white">{listing.title}</span> has been confirmed.
              </p>

              {/* Reservation Snapshot Card */}
              <div className="w-full bg-gray-50 dark:bg-[#262626] border border-airbnb-border dark:border-gray-700/60 rounded-2xl p-4 text-left flex flex-col gap-3 mb-6">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-airbnb-grey dark:text-gray-400">
                    Reservation Code
                  </span>
                  <span className="text-xs font-mono font-extrabold text-airbnb-black dark:text-white bg-white dark:bg-[#1A1A1A] px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700">
                    #TRIP-{confirmedBooking?.id || '2026'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[10px] font-bold text-airbnb-grey dark:text-gray-400 uppercase">Check-in</div>
                    <div className="font-bold text-airbnb-black dark:text-white mt-0.5">{checkIn}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-airbnb-grey dark:text-gray-400 uppercase">Check-out</div>
                    <div className="font-bold text-airbnb-black dark:text-white mt-0.5">{checkOut}</div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-2.5 flex items-center justify-between text-xs">
                  <span className="text-airbnb-grey dark:text-gray-400">Total Paid</span>
                  <span className="font-extrabold text-airbnb-black dark:text-white text-sm">
                    ₹{confirmedBooking?.total_price.toLocaleString('en-IN') || (priceQuote ? priceQuote.total_price.toLocaleString('en-IN') : listing.price_per_night.toLocaleString('en-IN'))}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <button
                  onClick={() => closeSuccessModal('/trips')}
                  className="w-full py-3.5 px-6 bg-airbnb-black dark:bg-white text-white dark:text-black font-bold text-sm rounded-2xl hover:opacity-90 transition-opacity shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>View My Trips</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => closeSuccessModal('/')}
                  className="w-full py-3.5 px-6 bg-gray-100 dark:bg-[#2A2A2A] text-airbnb-black dark:text-white font-bold text-sm rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  Explore More
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
