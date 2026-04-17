export interface Store {
  id: string;
  name: string;
  type: 'supermarket' | 'wet_market' | 'fish_port' | 'neighborhood' | 'mall' | 'stall' | 'salon' | 'barbershop' | 'pharmacy' | 'bakery' | 'restaurant' | 'hardware' | 'clothing' | 'other';
  address: string;
  location: string;
  locationCoords: { lat: number; lng: number };
  rating: number;
  totalPosts: number;
  categories: string[];
  openHours: string;
  description: string;
  verified: boolean;
  vouchCount: number;
  trustRating: number;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userTrustBadge: 'verified' | 'trusted' | 'new';
  confidenceLevel: 'High' | 'Medium' | 'Low';
  productName: string;
  category: string;
  price: number;
  unit: string;
  mediaUrl: string;
  mediaType?: 'photo' | 'video' | null;
  location: string;
  storeName: string;
  storeId: string;
  locationCoords: { lat: number; lng: number };
  timestamp: number;
  vouchCount: number;
  commentCount: number;
  marketInsight: string;
  insightType: 'below' | 'lowest' | 'above' | 'average';
}

export interface MarketInsight {
  productName: string;
  locationCluster: string;
  avgPrice: number;
  medianPrice: number;
  lowestPrice: number;
  highestPrice: number;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercent: number;
  totalReports: number;
  priceHistory: number[];
  unit: string;
  lastUpdated: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: number;
}

export interface PriceAlert {
  id: string;
  userId: string;
  productName: string;
  targetPrice: number;
  unit: string;
  radius: number;
  location: string;
  active: boolean;
}

const now = Date.now();

export const mockStores: Store[] = [
  {
    id: 's1',
    name: 'WalterMart Tanauan',
    type: 'supermarket',
    address: 'J.P. Laurel Highway, Tanauan, Batangas',
    location: 'Tanauan, Batangas',
    locationCoords: { lat: 14.0863, lng: 121.1486 },
    rating: 4.5,
    totalPosts: 36,
    categories: ['Rice', 'Meat', 'Vegetables', 'Eggs'],
    openHours: '8:00 AM – 9:00 PM',
    description: 'Large supermarket with wide grocery selection. Known for competitive prices on rice and household goods.',
    verified: true,
    vouchCount: 82,
    trustRating: 94,
  },
  {
    id: 's2',
    name: 'Tanauan Public Market',
    type: 'wet_market',
    address: 'Poblacion, Tanauan, Batangas',
    location: 'Tanauan, Batangas',
    locationCoords: { lat: 14.0873, lng: 121.1506 },
    rating: 4.2,
    totalPosts: 52,
    categories: ['Meat', 'Fish', 'Vegetables'],
    openHours: '5:00 AM – 5:00 PM',
    description: 'The main public market in Tanauan. Best place for fresh meat, fish, and vegetables at wholesale prices.',
    verified: true,
    vouchCount: 104,
    trustRating: 96,
  },
  {
    id: 's3',
    name: 'Local Wet Market',
    type: 'wet_market',
    address: 'Brgy. Darasa, Tanauan, Batangas',
    location: 'Tanauan, Batangas',
    locationCoords: { lat: 14.0843, lng: 121.1466 },
    rating: 3.8,
    totalPosts: 18,
    categories: ['Fish', 'Vegetables', 'Meat'],
    openHours: '5:30 AM – 3:00 PM',
    description: 'Neighborhood wet market in Darasa with fresh daily catches and local vegetables.',
    verified: false,
    vouchCount: 29,
    trustRating: 72,
  },
  {
    id: 's4',
    name: 'Neighborhood Store',
    type: 'neighborhood',
    address: 'Brgy. Sambat, Tanauan, Batangas',
    location: 'Tanauan, Batangas',
    locationCoords: { lat: 14.0893, lng: 121.1526 },
    rating: 3.5,
    totalPosts: 8,
    categories: ['Eggs', 'Rice'],
    openHours: '6:00 AM – 10:00 PM',
    description: 'Small neighborhood sari-sari store. Convenient for everyday items.',
    verified: false,
    vouchCount: 11,
    trustRating: 61,
  },
  {
    id: 's5',
    name: 'Tanauan Fish Port',
    type: 'fish_port',
    address: 'Tanauan Lakeshore, Tanauan, Batangas',
    location: 'Tanauan, Batangas',
    locationCoords: { lat: 14.0833, lng: 121.1446 },
    rating: 4.6,
    totalPosts: 24,
    categories: ['Fish'],
    openHours: '4:00 AM – 12:00 PM',
    description: 'Direct from fishermen! Freshest catch in Tanauan from Taal Lake. Best prices early morning.',
    verified: true,
    vouchCount: 63,
    trustRating: 92,
  },
  {
    id: 's6',
    name: 'SM Tanauan',
    type: 'mall',
    address: 'Tanauan City Center, Tanauan, Batangas',
    location: 'Tanauan, Batangas',
    locationCoords: { lat: 14.0883, lng: 121.1516 },
    rating: 4.3,
    totalPosts: 42,
    categories: ['Meat', 'Rice', 'Vegetables', 'Eggs'],
    openHours: '10:00 AM – 9:00 PM',
    description: 'Major mall with SM Supermarket inside. Regular promos and member discounts.',
    verified: true,
    vouchCount: 75,
    trustRating: 90,
  },
  {
    id: 's7',
    name: 'Public Market Stall 12',
    type: 'stall',
    address: 'Stall 12, Tanauan Public Market, Tanauan',
    location: 'Tanauan, Batangas',
    locationCoords: { lat: 14.0853, lng: 121.1476 },
    rating: 4.0,
    totalPosts: 14,
    categories: ['Vegetables'],
    openHours: '5:00 AM – 4:00 PM',
    description: 'Aling Rosa\'s vegetable stall. Known for fresh local produce from nearby farms.',
    verified: false,
    vouchCount: 20,
    trustRating: 68,
  },
  {
    id: 's8',
    name: 'Puregold Tanauan',
    type: 'supermarket',
    address: 'Star Toll Exit, Tanauan, Batangas',
    location: 'Tanauan, Batangas',
    locationCoords: { lat: 14.0900, lng: 121.1540 },
    rating: 4.1,
    totalPosts: 30,
    categories: ['Rice', 'Eggs', 'Meat', 'Vegetables'],
    openHours: '8:00 AM – 9:00 PM',
    description: 'Budget-friendly supermarket with wholesale options. Great for bulk buying.',
    verified: true,
    vouchCount: 58,
    trustRating: 88,
  },
];

export const mockPosts: Post[] = [
  {
    id: 'p1',
    userId: 'u1',
    userName: 'Maria Santos',
    userAvatar: 'MS',
    userTrustBadge: 'verified',
    confidenceLevel: 'High',
    productName: 'Well-milled Rice',
    category: 'Rice',
    price: 52,
    unit: 'kg',
    mediaUrl: 'rice',
    location: 'Tanauan, Batangas',
    storeName: 'WalterMart Tanauan',
    storeId: 's1',
    locationCoords: { lat: 14.0863, lng: 121.1486 },
    timestamp: now - 12 * 60 * 1000,
    vouchCount: 24,
    commentCount: 8,
    marketInsight: '₱3 below local average',
    insightType: 'below',
  },
  {
    id: 'p2',
    userId: 'u2',
    userName: 'Juan dela Cruz',
    userAvatar: 'JC',
    userTrustBadge: 'verified',
    confidenceLevel: 'High',
    productName: 'Pork Belly',
    category: 'Meat',
    price: 190,
    unit: 'kg',
    mediaUrl: 'pork',
    location: 'Tanauan, Batangas',
    storeName: 'Tanauan Public Market',
    storeId: 's2',
    locationCoords: { lat: 14.0873, lng: 121.1506 },
    timestamp: now - 45 * 60 * 1000,
    vouchCount: 18,
    commentCount: 5,
    marketInsight: '₱10 below local average',
    insightType: 'below',
  },
  {
    id: 'p3',
    userId: 'u3',
    userName: 'Ana Reyes',
    userAvatar: 'AR',
    userTrustBadge: 'trusted',
    confidenceLevel: 'Medium',
    productName: 'Tilapia',
    category: 'Fish',
    price: 160,
    unit: 'kg',
    mediaUrl: 'fish',
    location: 'Tanauan, Batangas',
    storeName: 'Local Wet Market',
    storeId: 's3',
    locationCoords: { lat: 14.0843, lng: 121.1466 },
    timestamp: now - 2 * 60 * 60 * 1000,
    vouchCount: 12,
    commentCount: 3,
    marketInsight: 'Lowest reported today',
    insightType: 'lowest',
  },
  {
    id: 'p4',
    userId: 'u4',
    userName: 'Pedro Garcia',
    userAvatar: 'PG',
    userTrustBadge: 'new',
    confidenceLevel: 'Low',
    productName: 'Eggs (Large)',
    category: 'Eggs',
    price: 8.5,
    unit: 'each',
    mediaUrl: 'eggs',
    location: 'Tanauan, Batangas',
    storeName: 'Neighborhood Store',
    storeId: 's4',
    locationCoords: { lat: 14.0893, lng: 121.1526 },
    timestamp: now - 5 * 60 * 60 * 1000,
    vouchCount: 6,
    commentCount: 2,
    marketInsight: 'Above market price',
    insightType: 'above',
  },
  {
    id: 'p5',
    userId: 'u5',
    userName: 'Rosa Lim',
    userAvatar: 'RL',
    userTrustBadge: 'verified',
    confidenceLevel: 'High',
    productName: 'Bangus (Milkfish)',
    category: 'Fish',
    price: 180,
    unit: 'kg',
    mediaUrl: 'bangus',
    location: 'Tanauan, Batangas',
    storeName: 'Tanauan Fish Port',
    storeId: 's5',
    locationCoords: { lat: 14.0833, lng: 121.1446 },
    timestamp: now - 8 * 60 * 60 * 1000,
    vouchCount: 15,
    commentCount: 4,
    marketInsight: '₱15 below local average',
    insightType: 'below',
  },
  {
    id: 'p6',
    userId: 'u1',
    userName: 'Maria Santos',
    userAvatar: 'MS',
    userTrustBadge: 'verified',
    confidenceLevel: 'High',
    productName: 'Chicken (Whole)',
    category: 'Meat',
    price: 175,
    unit: 'kg',
    mediaUrl: 'chicken',
    location: 'Tanauan, Batangas',
    storeName: 'SM Tanauan',
    storeId: 's6',
    locationCoords: { lat: 14.0883, lng: 121.1516 },
    timestamp: now - 10 * 60 * 60 * 1000,
    vouchCount: 20,
    commentCount: 7,
    marketInsight: 'Lowest reported today',
    insightType: 'lowest',
  },
  {
    id: 'p7',
    userId: 'u6',
    userName: 'Carlo Mendoza',
    userAvatar: 'CM',
    userTrustBadge: 'trusted',
    confidenceLevel: 'Medium',
    productName: 'Tomatoes',
    category: 'Vegetables',
    price: 80,
    unit: 'kg',
    mediaUrl: 'tomato',
    location: 'Tanauan, Batangas',
    storeName: 'Public Market Stall 12',
    storeId: 's7',
    locationCoords: { lat: 14.0853, lng: 121.1476 },
    timestamp: now - 13 * 60 * 60 * 1000,
    vouchCount: 9,
    commentCount: 2,
    marketInsight: 'Above market price',
    insightType: 'above',
  },
  {
    id: 'p8',
    userId: 'u7',
    userName: 'Lisa Tan',
    userAvatar: 'LT',
    userTrustBadge: 'verified',
    confidenceLevel: 'High',
    productName: 'Onion (Red)',
    category: 'Vegetables',
    price: 120,
    unit: 'kg',
    mediaUrl: 'onion',
    location: 'Tanauan, Batangas',
    storeName: 'WalterMart Tanauan',
    storeId: 's1',
    locationCoords: { lat: 14.0863, lng: 121.1490 },
    timestamp: now - 20 * 60 * 60 * 1000,
    vouchCount: 22,
    commentCount: 11,
    marketInsight: '₱20 below local average',
    insightType: 'below',
  },
  {
    id: 'p9',
    userId: 'u8',
    userName: 'Mark Valdez',
    userAvatar: 'MV',
    userTrustBadge: 'trusted',
    confidenceLevel: 'Medium',
    productName: 'Motorcycle Ride to Poblacion',
    category: 'Local Services',
    price: 35,
    unit: 'trip',
    mediaUrl: 'services',
    location: 'Tanauan, Batangas',
    storeName: 'Current Location',
    storeId: '',
    locationCoords: { lat: 14.0887, lng: 121.1498 },
    timestamp: now - 3 * 60 * 60 * 1000,
    vouchCount: 5,
    commentCount: 1,
    marketInsight: 'Lowest reported today',
    insightType: 'lowest',
  },
  {
    id: 'p10',
    userId: 'u9',
    userName: 'Joy Ramos',
    userAvatar: 'JR',
    userTrustBadge: 'new',
    confidenceLevel: 'Medium',
    productName: 'Basic Haircut',
    category: 'Local Services',
    price: 120,
    unit: 'service',
    mediaUrl: 'no_media',
    location: 'Tanauan, Batangas',
    storeName: 'Neighborhood Store',
    storeId: 's4',
    locationCoords: { lat: 14.0893, lng: 121.1526 },
    timestamp: now - 7 * 60 * 60 * 1000,
    vouchCount: 3,
    commentCount: 0,
    marketInsight: '₱20 below local average',
    insightType: 'below',
  },
];

export const mockMarketInsights: MarketInsight[] = [
  {
    productName: 'Well-milled Rice',
    locationCluster: 'Tanauan, Batangas',
    avgPrice: 55,
    medianPrice: 54,
    lowestPrice: 52,
    highestPrice: 60,
    trendDirection: 'down',
    trendPercent: 2,
    totalReports: 22,
    priceHistory: [58, 57, 56, 55, 54, 55, 53, 52, 54, 53, 52, 52],
    unit: 'kg',
    lastUpdated: now,
  },
  {
    productName: 'Pork Belly',
    locationCluster: 'Tanauan, Batangas',
    avgPrice: 200,
    medianPrice: 195,
    lowestPrice: 175,
    highestPrice: 220,
    trendDirection: 'down',
    trendPercent: 3,
    totalReports: 14,
    priceHistory: [210, 205, 200, 198, 195, 190, 192, 188, 185, 190, 188, 190],
    unit: 'kg',
    lastUpdated: now,
  },
  {
    productName: 'Tilapia',
    locationCluster: 'Tanauan, Batangas',
    avgPrice: 170,
    medianPrice: 168,
    lowestPrice: 160,
    highestPrice: 185,
    trendDirection: 'stable',
    trendPercent: 0,
    totalReports: 10,
    priceHistory: [172, 170, 168, 165, 170, 168, 165, 162, 160, 165, 163, 160],
    unit: 'kg',
    lastUpdated: now,
  },
  {
    productName: 'Eggs (Large)',
    locationCluster: 'Tanauan, Batangas',
    avgPrice: 8,
    medianPrice: 8,
    lowestPrice: 7.5,
    highestPrice: 9,
    trendDirection: 'up',
    trendPercent: 5,
    totalReports: 18,
    priceHistory: [7.5, 7.5, 7.8, 8, 8, 8.2, 8, 8.5, 8.5, 8.3, 8.5, 8.5],
    unit: 'each',
    lastUpdated: now,
  },
  {
    productName: 'Bangus (Milkfish)',
    locationCluster: 'Tanauan, Batangas',
    avgPrice: 195,
    medianPrice: 192,
    lowestPrice: 180,
    highestPrice: 210,
    trendDirection: 'down',
    trendPercent: 4,
    totalReports: 11,
    priceHistory: [205, 200, 198, 195, 192, 190, 188, 185, 182, 180, 182, 180],
    unit: 'kg',
    lastUpdated: now,
  },
  {
    productName: 'Chicken (Whole)',
    locationCluster: 'Tanauan, Batangas',
    avgPrice: 185,
    medianPrice: 182,
    lowestPrice: 175,
    highestPrice: 200,
    trendDirection: 'stable',
    trendPercent: 1,
    totalReports: 16,
    priceHistory: [188, 185, 183, 180, 178, 175, 178, 180, 182, 180, 178, 175],
    unit: 'kg',
    lastUpdated: now,
  },
  {
    productName: 'Tomatoes',
    locationCluster: 'Tanauan, Batangas',
    avgPrice: 75,
    medianPrice: 74,
    lowestPrice: 65,
    highestPrice: 85,
    trendDirection: 'up',
    trendPercent: 7,
    totalReports: 9,
    priceHistory: [68, 70, 72, 74, 75, 78, 76, 78, 80, 78, 80, 80],
    unit: 'kg',
    lastUpdated: now,
  },
  {
    productName: 'Onion (Red)',
    locationCluster: 'Tanauan, Batangas',
    avgPrice: 140,
    medianPrice: 135,
    lowestPrice: 120,
    highestPrice: 160,
    trendDirection: 'down',
    trendPercent: 8,
    totalReports: 20,
    priceHistory: [155, 150, 148, 145, 140, 138, 135, 130, 128, 125, 122, 120],
    unit: 'kg',
    lastUpdated: now,
  },
  {
    productName: 'Motorcycle Ride to Poblacion',
    locationCluster: 'Tanauan, Batangas',
    avgPrice: 40,
    medianPrice: 40,
    lowestPrice: 35,
    highestPrice: 50,
    trendDirection: 'down',
    trendPercent: 3,
    totalReports: 7,
    priceHistory: [50, 45, 45, 42, 42, 40, 40, 38, 38, 35, 35, 35],
    unit: 'trip',
    lastUpdated: now,
  },
  {
    productName: 'Basic Haircut',
    locationCluster: 'Tanauan, Batangas',
    avgPrice: 135,
    medianPrice: 130,
    lowestPrice: 120,
    highestPrice: 160,
    trendDirection: 'stable',
    trendPercent: 0,
    totalReports: 6,
    priceHistory: [130, 130, 140, 135, 135, 130, 130, 130, 125, 120, 120, 120],
    unit: 'service',
    lastUpdated: now,
  },
];

export const categories = [
  'All',
  // Grocery & Food
  'Rice',
  'Meat',
  'Vegetables',
  'Fish',
  'Eggs',
  'Fruits',
  'Poultry',
  'Seafood',
  'Dairy',
  'Beverages',
  'Spices',
  'Snacks',
  'Bakery',
  // Household & Retail
  'Household',
  'Fuel',
  'Pharmacy',
  'Clothing',
  'Electronics',
  'Hardware',
  // Personal Services
  'Haircut',
  'Barber',
  'Salon',
  'Massage',
  'Spa',
  'Beauty',
  // Transportation & Logistics
  'Motorcycle Ride',
  'Tricycle Ride',
  'Delivery Service',
  'Courier',
  // Home & Handyman Services
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Welding',
  'Painting',
  'Cleaning Service',
  // Automotive
  'Car Wash',
  'Car Repair',
  'Motorcycle Repair',
  // Food Services
  'Restaurant',
  'Catering',
  'Food Delivery',
  'Baking Service',
  // Education & Lessons
  'Tutoring',
  'Language Lessons',
  'Music Lessons',
  'Art Lessons',
  // Health & Wellness
  'Doctor Consultation',
  'Dental Service',
  'Physical Therapy',
  'Fitness Coaching',
  // Entertainment & Events
  'Photography',
  'Videography',
  'Event Catering',
  'DJ Service',
  // Pet Services
  'Pet Grooming',
  'Pet Veterinary',
  'Pet Training',
];

export const mockComments: Comment[] = [
  { id: 'c1', postId: 'p1', userId: 'u2', userName: 'Juan dela Cruz', userAvatar: 'JC', text: 'Confirmed! Just bought from WalterMart, same price.', timestamp: now - 8 * 60 * 1000 },
  { id: 'c2', postId: 'p1', userId: 'u3', userName: 'Ana Reyes', userAvatar: 'AR', text: 'Is this the 5kg or 25kg pack?', timestamp: now - 6 * 60 * 1000 },
  { id: 'c3', postId: 'p1', userId: 'u1', userName: 'Maria Santos', userAvatar: 'MS', text: 'This is per kg, loose rice. They also have 25kg sacks for ₱1,250.', timestamp: now - 5 * 60 * 1000 },
  { id: 'c4', postId: 'p2', userId: 'u5', userName: 'Rosa Lim', userAvatar: 'RL', text: 'Good deal! Yesterday it was ₱200/kg at the same stall.', timestamp: now - 30 * 60 * 1000 },
  { id: 'c5', postId: 'p2', userId: 'u3', userName: 'Ana Reyes', userAvatar: 'AR', text: 'Which stall in the public market?', timestamp: now - 25 * 60 * 1000 },
  { id: 'c6', postId: 'p2', userId: 'u6', userName: 'Carlo Mendoza', userAvatar: 'CM', text: 'Stall 8, near the entrance. The vendor is Aling Nena.', timestamp: now - 20 * 60 * 1000 },
  { id: 'c7', postId: 'p3', userId: 'u4', userName: 'Pedro Garcia', userAvatar: 'PG', text: 'Fresh catch today! Went there at 6am.', timestamp: now - 1.5 * 60 * 60 * 1000 },
  { id: 'c8', postId: 'p3', userId: 'u1', userName: 'Maria Santos', userAvatar: 'MS', text: 'How big are the fish?', timestamp: now - 1 * 60 * 60 * 1000 },
  { id: 'c9', postId: 'p4', userId: 'u2', userName: 'Juan dela Cruz', userAvatar: 'JC', text: 'Eggs at Puregold are ₱7.50 each, try there.', timestamp: now - 4 * 60 * 60 * 1000 },
  { id: 'c10', postId: 'p5', userId: 'u6', userName: 'Carlo Mendoza', userAvatar: 'CM', text: 'Bangus here is always fresh. Best in town!', timestamp: now - 7 * 60 * 60 * 1000 },
  { id: 'c11', postId: 'p5', userId: 'u7', userName: 'Lisa Tan', userAvatar: 'LT', text: 'Do they debone for free?', timestamp: now - 6 * 60 * 60 * 1000 },
  { id: 'c12', postId: 'p6', userId: 'u4', userName: 'Pedro Garcia', userAvatar: 'PG', text: 'SM had a promo last week, ₱165/kg. Wish it was still on.', timestamp: now - 9 * 60 * 60 * 1000 },
  { id: 'c13', postId: 'p6', userId: 'u3', userName: 'Ana Reyes', userAvatar: 'AR', text: 'Still cheaper than the public market today.', timestamp: now - 8.5 * 60 * 60 * 1000 },
  { id: 'c14', postId: 'p7', userId: 'u1', userName: 'Maria Santos', userAvatar: 'MS', text: 'Tomato prices are crazy high lately!', timestamp: now - 12 * 60 * 60 * 1000 },
  { id: 'c15', postId: 'p8', userId: 'u5', userName: 'Rosa Lim', userAvatar: 'RL', text: 'Onion prices finally going down! Was ₱250 two months ago.', timestamp: now - 18 * 60 * 60 * 1000 },
  { id: 'c16', postId: 'p8', userId: 'u2', userName: 'Juan dela Cruz', userAvatar: 'JC', text: 'Still expensive for onions honestly.', timestamp: now - 17 * 60 * 60 * 1000 },
  { id: 'c17', postId: 'p9', userId: 'u1', userName: 'Maria Santos', userAvatar: 'MS', text: 'Booked this route today, same fare.', timestamp: now - 2 * 60 * 60 * 1000 },
];

export function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function getPostAge(timestamp: number): 'fresh' | 'expiring' | 'expired' {
  const hours = (Date.now() - timestamp) / 3600000;
  if (hours < 48) return 'fresh';
  if (hours < 350) return 'expiring';
  return 'expired';
}

export function getMediaGradient(type: string): string {
  const gradients: Record<string, string> = {
    rice: 'from-amber-100 via-amber-50 to-yellow-100',
    pork: 'from-rose-100 via-red-50 to-pink-100',
    fish: 'from-cyan-100 via-blue-50 to-sky-100',
    eggs: 'from-orange-100 via-yellow-50 to-amber-100',
    bangus: 'from-blue-100 via-cyan-50 to-teal-100',
    chicken: 'from-yellow-100 via-orange-50 to-amber-100',
    tomato: 'from-red-100 via-rose-50 to-pink-100',
    onion: 'from-purple-100 via-pink-50 to-rose-100',
    services: 'from-violet-100 via-fuchsia-50 to-purple-100',
    no_media: 'from-slate-100 via-gray-50 to-slate-100',
  };
  return gradients[type] || 'from-gray-100 via-gray-50 to-gray-100';
}

export function getMediaEmoji(type: string): string {
  const emojis: Record<string, string> = {
    rice: '🍚',
    pork: '🥩',
    fish: '🐟',
    eggs: '🥚',
    bangus: '🐠',
    chicken: '🍗',
    tomato: '🍅',
    onion: '🧅',
    services: '🛠️',
    no_media: '📝',
  };
  return emojis[type] || '📦';
}

export function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    Rice: '🍚', Meat: '🥩', Vegetables: '🥬', Fish: '🐟', Eggs: '🥚',
    Fruits: '🍎', Poultry: '🍗', Seafood: '🦐', Dairy: '🥛', Beverages: '🥤',
    Spices: '🌶️', Snacks: '🍪', Bakery: '🥖',
    Household: '🧼', Fuel: '⛽', Pharmacy: '💊', Clothing: '👗', Electronics: '📱', Hardware: '🔧',
    Haircut: '✂️', Barber: '💈', Salon: '💅', Massage: '💆', Spa: '🧖', Beauty: '💄',
    'Motorcycle Ride': '🏍️', 'Tricycle Ride': '🛺', 'Delivery Service': '🚚', Courier: '📦',
    Plumbing: '🚰', Electrical: '⚡', Carpentry: '🪛', Welding: '🔥', Painting: '🎨', 'Cleaning Service': '🧹',
    'Car Wash': '🚗', 'Car Repair': '🔩', 'Motorcycle Repair': '🏍️',
    Restaurant: '🍽️', Catering: '🍴', 'Food Delivery': '🍜', 'Baking Service': '🎂',
    Tutoring: '📚', 'Doctor Consultation': '⚕️', 'Dental Service': '🦷', 'Physical Therapy': '🏃', 'Fitness Coaching': '💪',
    Photography: '📸', 'Event Catering': '🎉', 'DJ Service': '🎧',
    'Pet Grooming': '🛁', 'Pet Veterinary': '🐾', 'Pet Training': '🐕',
    'Local Services': '🛠️',
  };
  return emojis[category] || '📦';
}

export function getStoreTypeLabel(type: Store['type']): string {
  const labels: Record<Store['type'], string> = {
    supermarket: 'Supermarket',
    wet_market: 'Wet Market',
    fish_port: 'Fish Port',
    neighborhood: 'Sari-sari Store',
    mall: 'Mall / Department Store',
    stall: 'Market Stall',
    salon: 'Salon',
    barbershop: 'Barbershop',
    pharmacy: 'Pharmacy',
    bakery: 'Bakery',
    restaurant: 'Restaurant / Carinderia',
    hardware: 'Hardware Store',
    clothing: 'Clothing / Ukay-ukay',
    other: 'Other',
  };
  return labels[type] || type;
}

export function getStoreEmoji(type: Store['type']): string {
  const emojis: Record<Store['type'], string> = {
    supermarket: '🏪',
    wet_market: '🏬',
    fish_port: '🐟',
    neighborhood: '🏠',
    mall: '🛍️',
    stall: '🪬',
    salon: '💅',
    barbershop: '💈',
    pharmacy: '💊',
    bakery: '🥐',
    restaurant: '🍽️',
    hardware: '🔧',
    clothing: '👗',
    other: '📍',
  };
  return emojis[type] || '📍';
}
