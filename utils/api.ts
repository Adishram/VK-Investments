import { Platform } from 'react-native';

// Backend API URL - Production
const API_URL = 'https://vk-investment-backend.onrender.com/api';

// PG Listing Interface
export interface PGListing {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  latitude: number;
  longitude: number;
  image_url: string;
  images?: string[];
  owner_contact: string;
  house_no: string;
  street: string;
  city: string;
  pincode: string;
  gender?: string; // 'men', 'women', 'unisex'
  occupancy_types?: string[];
  occupancy_prices?: { [key: string]: number };
  food_included: boolean;
  notice_period?: string;
  gate_close_time?: string;
  safety_deposit?: string;
  amenities?: string[];
  rules?: string[];
  rooms?: any[];
  rating?: number;
  rating_count?: number;
  owner_id?: string;
  owner_email?: string;
  created_at?: string;
}

// Review Interface
export interface Review {
  id: number;
  pg_id: number;
  user_name: string;
  rating: number;
  review_text: string;
  review_images?: string[];
  created_at: string;
}

// Helper function to clean price - extracts numeric value from formatted string like "₹15000/mo"
const cleanPrice = (price: any): number => {
  if (typeof price === 'number') return price;
  if (typeof price === 'string') {
    // Remove currency symbols, commas, and suffixes like /mo, /month
    const cleaned = price.replace(/[₹,]/g, '').replace(/\/mo(nth)?/gi, '').trim();
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

// Helper function to clean PG data from backend
const cleanPGData = (pg: any): PGListing => {
  return {
    ...pg,
    price: cleanPrice(pg.price),
    latitude: typeof pg.latitude === 'string' ? parseFloat(pg.latitude) : pg.latitude,
    longitude: typeof pg.longitude === 'string' ? parseFloat(pg.longitude) : pg.longitude,
  };
};

// API Functions
export const api = {
  // Get all PGs
  async getPGs(ownerId?: string): Promise<PGListing[]> {
    const url = ownerId ? `${API_URL}/pg?owner_id=${ownerId}` : `${API_URL}/pg`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch PGs');
    const data = await response.json();
    // Clean all PG data to fix formatted price strings
    return data.map((pg: any) => cleanPGData(pg));
  },

  // Get PG by ID
  async getPGById(id: number): Promise<PGListing> {
    const pgs = await this.getPGs();
    const pg = pgs.find(p => p.id === id);
    if (!pg) throw new Error('PG not found');
    return pg;
  },

  // Search PGs
  async searchPGs(query: string, city?: string): Promise<PGListing[]> {
    const allPGs = await this.getPGs();
    return allPGs.filter(pg => {
      const matchesQuery = pg.title.toLowerCase().includes(query.toLowerCase()) ||
                          pg.location.toLowerCase().includes(query.toLowerCase()) ||
                          pg.city.toLowerCase().includes(query.toLowerCase());
      const matchesCity = !city || pg.city.toLowerCase() === city.toLowerCase();
      return matchesQuery && matchesCity;
    });
  },

  // Get PGs by city
  async getPGsByCity(city: string): Promise<PGListing[]> {
    const allPGs = await this.getPGs();
    return allPGs.filter(pg => pg.city.toLowerCase() === city.toLowerCase());
  },

  // Get recommended PGs (high rated or nearby)
  async getRecommendedPGs(city?: string): Promise<PGListing[]> {
    const allPGs = await this.getPGs();
    let filtered = city
      ? allPGs.filter(pg => pg.city.toLowerCase() === city.toLowerCase())
      : allPGs;

    // Sort by rating
    return filtered
      .filter(pg => pg.rating && pg.rating > 4)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);
  },

  // Add PG
  async addPG(pgData: Partial<PGListing>): Promise<PGListing> {
    const response = await fetch(`${API_URL}/pg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pgData),
    });
    if (!response.ok) throw new Error('Failed to add PG');
    return response.json();
  },

  // Get reviews for a PG
  async getReviews(pgId: number): Promise<Review[]> {
    const response = await fetch(`${API_URL}/pg/${pgId}/reviews`);
    if (!response.ok) throw new Error('Failed to fetch reviews');
    return response.json();
  },

  // Add review
  async addReview(
    pgId: number,
    userName: string,
    rating: number,
    reviewText: string,
    reviewImages?: string[]
  ): Promise<Review> {
    const response = await fetch(`${API_URL}/pg/${pgId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: userName,
        rating,
        review_text: reviewText,
        review_images: reviewImages || [],
      }),
    });
    if (!response.ok) throw new Error('Failed to add review');
    return response.json();
  },

  // Geocode address
  async geocodeAddress(address: string): Promise<{ lat: number; lon: number; display_name: string }> {
    const response = await fetch(`${API_URL}/geocode?address=${encodeURIComponent(address)}`);
    if (!response.ok) throw new Error('Failed to geocode address');
    return response.json();
  },

  
  // Update User Profile (Phone)
  async updateUserProfile(email: string, phone: string) {
    const response = await fetch(`${API_URL}/user/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone }),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },

  // Get User Profile
  async getUserProfile(email: string) {
    const response = await fetch(`${API_URL}/user/profile/${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  // Send Chat Message
  async sendChatMessage(
    message: string,
    history: { role: string; content: string }[],
    userEmail?: string,
    city?: string
  ): Promise<{ text: string; pgIds?: number[] }> {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history,
        userEmail,
        city
      }),
    });
    
    if (!response.ok) throw new Error('Failed to send message');
    const data = await response.json();
    
    return {
      text: data.content || data.message || 'I could not understand that.',
      pgIds: data.pgIds
    };
  },

  // Get My PG (User's booked PG)
  async getMyPG(email: string): Promise<{
    hasPG: boolean;
    pg?: PGListing;
    customer?: any;
  }> {
    const response = await fetch(`${API_URL}/user/${encodeURIComponent(email)}/my-pg`);
    if (!response.ok) throw new Error('Failed to fetch My PG');
    return response.json();
  },

  // Schedule Visit Request
  async scheduleVisit(
    userEmail: string,
    userName: string,
    pgId: number,
    ownerEmail: string,
    visitDate: string,
    visitTime: string
  ): Promise<any> {
    const response = await fetch(`${API_URL}/visit-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail,
        userName,
        pgId,
        ownerEmail,
        visitDate,
        visitTime,
      }),
    });
    if (!response.ok) throw new Error('Failed to schedule visit');
    return response.json();
  },

  // Get User's Visit Requests
  async getVisitRequests(email: string): Promise<any[]> {
    const response = await fetch(`${API_URL}/visit-request/${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error('Failed to fetch visit requests');
    return response.json();
  },

  // Confirm Booking / Payment
  async confirmBooking(data: {
    name: string;
    email: string;
    mobile: string;
    pgId: number;
    roomType: string;
    amount: number;
    moveInDate?: string | null;
  }): Promise<any> {
    const response = await fetch(`${API_URL}/payment/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to confirm booking');
    return response.json();
  },

  // Update Customer Check-in Date
  async updateCheckInDate(customerId: number, moveInDate: string): Promise<any> {
    const response = await fetch(`${API_URL}/customer/${customerId}/check-in-date`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moveInDate }),
    });
    if (!response.ok) throw new Error('Failed to update check-in date');
    return response.json();
  },

  // Cancel Booking
  async cancelBooking(customerId: number): Promise<any> {
    const response = await fetch(`${API_URL}/customer/${customerId}/cancel`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to cancel booking');
    return response.json();
  },

  // ==================== SUPER ADMIN APIs ====================

  // Super Admin Login
  async superAdminLogin(email: string, password: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/super-admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Invalid credentials');
    return response.json();
  },

  // Get Availability (All PGs with details)
  async getAvailability(search?: string, city?: string, locality?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (city) params.append('city', city);
    if (locality) params.append('locality', locality);
    
    const url = `${API_URL}/super-admin/availability${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch availability');
    return response.json();
  },

  // Get Booking Reports
  async getBookingReports(search?: string, pgName?: string, roomType?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (pgName) params.append('pgName', pgName);
    if (roomType) params.append('roomType', roomType);
    
    const url = `${API_URL}/super-admin/bookings${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return response.json();
  },

  // Get All PG Owners
  async getOwners(search?: string): Promise<any[]> {
    const url = search 
      ? `${API_URL}/super-admin/owners?search=${encodeURIComponent(search)}`
      : `${API_URL}/super-admin/owners`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch owners');
    return response.json();
  },

  // Add PG Owner
  async addOwner(data: {
    name: string;
    email: string;
    mobile: string;
    city: string;
    state?: string;
  }): Promise<{ owner: any; generatedPassword: string; message: string }> {
    const response = await fetch(`${API_URL}/super-admin/add-owner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add owner');
    }
    return response.json();
  },

  // Get Owner Details with PGs and Customers
  async getOwnerDetails(id: number): Promise<{
    owner: any;
    pgs: any[];
    stats: { totalPGs: number; totalCustomers: number };
  }> {
    const response = await fetch(`${API_URL}/super-admin/owner/${id}/details`);
    if (!response.ok) throw new Error('Failed to fetch owner details');
    return response.json();
  },

  // Delete PG Owner
  async deleteOwner(id: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/super-admin/owner/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete owner');
    return response.json();
  },

  // Notify Customers for Payment
  async notifyPayment(): Promise<{ message: string; announcementsCreated: number; emailsSent: number }> {
    const response = await fetch(`${API_URL}/super-admin/notify-payment`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to send notifications');
    return response.json();
  },

  // ==================== OWNER APIs ====================

  // Owner Login
  async ownerLogin(email: string, password: string): Promise<{ success: boolean; owner?: any }> {
    const response = await fetch(`${API_URL}/owner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Invalid credentials');
    return response.json();
  },

  // Get Owner Profile
  async getOwnerProfile(ownerId: number): Promise<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    city: string;
    address: string;
    dob: string;
    profilePicture: string | null;
  }> {
    const response = await fetch(`${API_URL}/owner/${ownerId}`);
    if (!response.ok) throw new Error('Failed to fetch owner profile');
    return response.json();
  },

  // Upload Owner Profile Image
  async uploadOwnerImage(ownerId: number, base64Image: string): Promise<{ message: string; profilePicture: string }> {
    const response = await fetch(`${API_URL}/owner/${ownerId}/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });
    if (!response.ok) throw new Error('Failed to upload image');
    return response.json();
  },

  // Get Owner Stats
  async getOwnerStats(ownerId: number): Promise<{
    totalPGs: number;
    totalCustomers: number;
    totalEarnings: number;
    pendingPayments: number;
    paidPayments: number;
  }> {
    const response = await fetch(`${API_URL}/owner/${ownerId}/stats`);
    if (!response.ok) throw new Error('Failed to fetch owner stats');
    return response.json();
  },

  // Get Owner's PGs
  async getOwnerPGs(ownerId: number): Promise<any[]> {
    const response = await fetch(`${API_URL}/pg?owner_id=${ownerId}`);
    if (!response.ok) throw new Error('Failed to fetch PGs');
    return response.json();
  },

  // Get Owner's Guests/Customers
  async getOwnerGuests(ownerId: number): Promise<any[]> {
    const response = await fetch(`${API_URL}/owner/${ownerId}/guests`);
    if (!response.ok) throw new Error('Failed to fetch guests');
    return response.json();
  },

  // Update Guest Room/Floor
  async updateGuestRoom(guestId: number, roomNo: string, floor: string): Promise<any> {
    const response = await fetch(`${API_URL}/owner/guest/${guestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_no: roomNo, floor }),
    });
    if (!response.ok) throw new Error('Failed to update guest');
    return response.json();
  },

  // Get Owner's Visits
  async getOwnerVisits(ownerId: number): Promise<any[]> {
    const response = await fetch(`${API_URL}/owner/${ownerId}/visits`);
    if (!response.ok) throw new Error('Failed to fetch visits');
    return response.json();
  },

  // Approve Visit
  async approveVisit(visitId: number): Promise<any> {
    const response = await fetch(`${API_URL}/visit-request/${visitId}/approve`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Failed to approve visit');
    return response.json();
  },

  // Reject Visit
  async rejectVisit(visitId: number): Promise<any> {
    const response = await fetch(`${API_URL}/visit-request/${visitId}/reject`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Failed to reject visit');
    return response.json();
  },

  // Get Owner's Payments
  async getOwnerPayments(ownerId: number): Promise<{
    customers: any[];
    totalEarnings: number;
    paidCount: number;
    dueCount: number;
  }> {
    const response = await fetch(`${API_URL}/owner/${ownerId}/payments`);
    if (!response.ok) throw new Error('Failed to fetch payments');
    return response.json();
  },

  // Update PG
  async updatePG(pgId: number, data: Partial<PGListing>): Promise<any> {
    const response = await fetch(`${API_URL}/pg/${pgId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update PG');
    return response.json();
  },

  // Create Announcement
  async createAnnouncement(pgId: number, ownerId: number, message: string): Promise<any> {
    const response = await fetch(`${API_URL}/owner/announcement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pgId, ownerId, message }),
    });
    if (!response.ok) throw new Error('Failed to create announcement');
    return response.json();
  },

  // Get Announcements for a PG
  async getAnnouncements(pgId: number): Promise<any[]> {
    const response = await fetch(`${API_URL}/pg/${pgId}/announcements`);
    if (!response.ok) throw new Error('Failed to fetch announcements');
    return response.json();
  },

  // Change Owner Password
  async changeOwnerPassword(email: string, currentPassword: string, newPassword: string): Promise<any> {
    const response = await fetch(`${API_URL}/owner/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, currentPassword, newPassword }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to change password');
    }
    return response.json();
  },
};

export default api;
