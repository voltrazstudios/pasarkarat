export const categories = ['Vintage', 'Antiques', 'Traditional Crafts', 'Electronics', 'Traditional Games', 'Collectibles', 'Clothing', 'Home & Decor'] as const;
export type Category = typeof categories[number];
export const categoryImages: Record<Category, string> = {
  'Vintage': '/images/categories/vintage.png',
  'Antiques': '/images/categories/antiques.png',
  'Traditional Crafts': '/images/categories/traditional-crafts.png',
  'Electronics': '/images/categories/electronics.png',
  'Traditional Games': '/images/categories/traditional-games.png',
  'Collectibles': '/images/categories/collectibles.png',
  'Clothing': '/images/categories/clothing.png',
  'Home & Decor': '/images/categories/home-decor.png',
};

export const platforms = ['Shopee','Carousell','Facebook','TikTok Shop','Mudah.my','Own website'] as const;
export type Platform = typeof platforms[number];
export type ProductLink = { platform: Platform; url: string };
export type Product = { id: string; slug: string; name: string; nameMs: string; image: string; category: Category; description: string; descriptionMs: string; links: ProductLink[]; featured: boolean; price?: number; currency?: 'MYR'; submitted?: boolean; sellerId?: string };

// External marketplace links supplied for the collection. Prices can differ by seller, so the site does not show one fixed product price.
export const products: Product[] = [
  {
    id: '1', slug: 'speaker', name: 'Speaker', nameMs: 'Pembesar Suara', image: '/images/products/speaker.jpg', category: 'Electronics',
    description: 'Compare available external listings for speaker across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk pembesar suara di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/Giteng-D092-Wooden-Speaker-USB2.0-Desktop-Notebook-Computer-Audio-Solid-Wood-Subwoofer-i.1666288194.54208254282?extraParams=%7B%22display_model_id%22%3A390734100863%2C%22model_selection_logic%22%3A3%7D&sp_atk=0b19b9d7-73dc-462d-90c9-c1cd7c4e9a3c&xptdk=0b19b9d7-73dc-462d-90c9-c1cd7c4e9a3c' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/kef-q35-floor-standing-speaker-pair-1227940216/?t-id=ajrJM8exft_1775894123070&t-referrer_browse_type=search_results&t-referrer_page_type=search&t-referrer_request_id=sM3QYVL0isPWVHZe&t-referrer_search_query=wood%20speaker&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=77' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/1663680621260159/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3A3c80f141-7935-4b2c-a32d-ceea23684d0f' },
    ],
    featured: true
  },
  {
    id: '2', slug: 'sepak-takraw', name: 'Sepak Takraw', nameMs: 'Sepak Takraw', image: '/images/products/sepak-takraw.jpg', category: 'Traditional Games',
    description: 'Compare available external listings for sepak takraw across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk sepak takraw di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/Rattan-Takraw-Ball-Traditional-Material-Durable-Standard-Size-i.252842567.5632095587?extraParams=%7B%22display_model_id%22%3A71161954247%2C%22model_selection_logic%22%3A3%7D&rModelId=71161954247&sp_atk=2941fc5b-f56b-4b8e-a8fe-60beb6f08577&vItemId=44323166785&vModelId=266883159435&vShopId=1432004273&xptdk=2941fc5b-f56b-4b8e-a8fe-60beb6f08577' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/e415-sepak-takraw-educational-toy-1410254065/?t-id=ajrJM8exft_1775894123070&t-referrer_browse_type=search_results&t-referrer_page_type=search&t-referrer_request_id=aLCY9dtVOyrtRTI4&t-referrer_search_query=sepak%20takraw&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=21' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/25886211371074074/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3A15bfaed9-b5f9-4726-8f17-98c4f6eb1dfc' },
    ],
    featured: true
  },
  {
    id: '3', slug: 'kompang', name: 'Kompang', nameMs: 'Kompang', image: '/images/products/kompang.jpg', category: 'Traditional Crafts',
    description: 'Compare available external listings for kompang across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk kompang di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/Malay-Traditional-Kompang-i.44383688.773153308?extraParams=%7B"display_model_id"%3A330026842248%2C"model_selection_logic"%3A3%7D&sp_atk=48777fce-799b-475d-9de9-4db9173adcc2&xptdk=48777fce-799b-475d-9de9-4db9173adcc2' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/traditional-malay-kompang-1425906305/?t-id=ajrJM8exft_1775894123070&t-referrer_browse_type=search_results&t-referrer_page_type=search&t-referrer_request_id=QoRuH9_IjStQBOOX&t-referrer_search_query=kompang&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=0' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/1188676659835643/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3Aba2542c0-d116-45b0-b0e1-7472807c245a' },
    ],
    featured: true
  },
  {
    id: '4', slug: 'wau', name: 'Wau', nameMs: 'Wau', image: '/images/products/wau.jpg', category: 'Traditional Crafts',
    description: 'Compare available external listings for wau across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk wau di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/Ready-Stock-Wau-Bulan-(Malaysia-Traditional-Kite)-*-Random-Color-i.168920823.3737051742?extraParams=%7B%22display_model_id%22%3A19211315417%2C%22model_selection_logic%22%3A3%7D&sp_atk=a2e68d74-bda9-4cc7-ae66-9c3c681a786d&xptdk=a2e68d74-bda9-4cc7-ae66-9c3c681a786d' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/malaysia-wau-bulan-1275063841/?t-id=ajrJM8exft_1775894123070&t-referrer_browse_type=search_results&t-referrer_page_type=search&t-referrer_request_id=bhoBJaAsS_BMqe56&t-referrer_search_query=wau&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=1' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/791183840576306/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3Aa7ed6305-e204-4359-9c6a-3a3bf2a1b762' },
    ],
    featured: true
  },
  {
    id: '5', slug: 'laptop', name: 'Laptop', nameMs: 'Komputer Riba', image: '/images/products/laptop.jpg', category: 'Electronics',
    description: 'Compare available external listings for laptop across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk komputer riba di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/(Refurbished)-H-P-14-G4-Windows-Laptop-14-inch-Display-Intel-Celeron-4GB-RAM-16GB-SSD-Win-10-i.645594556.25175920280?extraParams=%7B%22display_model_id%22%3A185121214271%2C%22model_selection_logic%22%3A3%7D&sp_atk=caa95e1d-b194-4a09-abf4-baea8915245a&xptdk=caa95e1d-b194-4a09-abf4-baea8915245a' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/hp-elitebook-laptop-840-g8-1419688964/?t-id=ajrJM8exft_1775894123070&t-referrer_browse_type=search_results&t-referrer_page_type=search&t-referrer_request_id=7vaLnyDd3ct3Syij&t-referrer_search_query=laptop&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=37' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/2384794681994056/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3Ae31b654b-ef06-442b-963c-17646bd6f86f' },
    ],
    featured: false
  },
  {
    id: '6', slug: 'majalah', name: 'Majalah', nameMs: 'Majalah', image: '/images/products/majalah.jpg', category: 'Collectibles',
    description: 'Compare available external listings for majalah across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk majalah di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/Majalah-Mastika-Preloved-majalah-legend-majalah-berinfomasi-majalh-popular-i.1721179876.57054603770?extraParams=%7B%22display_model_id%22%3A415429366293%2C%22model_selection_logic%22%3A3%7D&sp_atk=799a9544-8667-4b0d-bcfa-1249308efb95&xptdk=799a9544-8667-4b0d-bcfa-1249308efb95' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/malay-magazines-majalah-melayu-1125750061/?t-id=ajrJM8exft_1775894123070&t-referrer_browse_type=search_results&t-referrer_page_type=search&t-referrer_request_id=j17YgahyjUMhJrtH&t-referrer_search_query=majalah&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=0' },
    ],
    featured: false
  },
  {
    id: '7', slug: 'storage-box', name: 'Storagebox', nameMs: 'Kotak Simpanan', image: '/images/products/storage-box.jpg', category: 'Home & Decor',
    description: 'Compare available external listings for storagebox across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk kotak simpanan di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/Abbaware-Storage-Box-38-Litre-Kotak-Simpanan-dengan-roda-Storage-Box-with-wheels-Bekas-Simpanan-Storage-container-i.435671945.18529962245?extraParams=%7B%22display_model_id%22%3A211547887197%2C%22model_selection_logic%22%3A3%7D&rModelId=211547887197&sp_atk=a38a1315-fa55-40b6-9a76-0528659a1621&vItemId=40077540340&vModelId=415347455779&vShopId=1432004273&xptdk=a38a1315-fa55-40b6-9a76-0528659a1621' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/big-storage-box-1431304913/?t-id=ajrJM8exft_1775894123070&t-referrer_browse_type=search_results&t-referrer_page_type=search&t-referrer_request_id=nl0MM0HZwJlWfO2s&t-referrer_search_query=storage%20box&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=14' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/1226767812899348/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3A017bee28-120e-49bf-a450-39a1d7648cc1' },
    ],
    featured: false
  },
  {
    id: '8', slug: 'gong', name: 'Gong', nameMs: 'Gong', image: '/images/products/gong.jpg', category: 'Traditional Crafts',
    description: 'Compare available external listings for gong across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk gong di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/Gong-17-Pemukul-Gong-Dikir-Barat-dan-Pemukul-i.61904920.16439818271?extraParams=%7B%22display_model_id%22%3A165186383159%2C%22model_selection_logic%22%3A3%7D&sp_atk=d812624a-03dc-49a6-b2f5-afae796d57fd&xptdk=d812624a-03dc-49a6-b2f5-afae796d57fd' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/vintage-wooden-gong-with-stand-1428002925/?t-id=ajrJM8exft_1775894123070&t-referrer_browse_type=search_results&t-referrer_page_type=search&t-referrer_request_id=omsBy3WpvMUeRfck&t-referrer_search_query=gong&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=1' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/2069279913639715/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3A4c8475f7-b8fc-4e15-8b83-0c0890728002' },
    ],
    featured: false
  },
  {
    id: '9', slug: 'tudung-saji', name: 'Tudung Saji', nameMs: 'Tudung Saji', image: '/images/products/tudung-saji.jpg', category: 'Traditional Crafts',
    description: 'Compare available external listings for tudung saji across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk tudung saji di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/TUDUNG-SAJI-MENGKUANG-TUDUNG-SAJI-BULUH-i.115650573.7668225849' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/2761610777515517/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3A3934372c-f1af-4891-98d8-66d44ca5def8' },
    ],
    featured: false
  },
  {
    id: '10', slug: 'pasu-antik-cina', name: 'Pasu Antik Cina', nameMs: 'Pasu Antik Cina', image: '/images/products/pasu-antik-cina.jpg', category: 'Antiques',
    description: 'Compare available external listings for pasu antik cina across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk pasu antik cina di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/Qianlong-Year-Made-Bottom-Model-Jingdezhen-Ceramic-Vase-Living-Room-Flower-Arrangement-Decoration-Antique-Chinese-High-End-Pastel-TV-Cabinet-Study-Bogu-Rack-Qianlong-Year-Made-Bottom-Model-Jingdezhen-Ceramic-Vase-Living-Room-Flower-Arrangement-Decoration-i.1263017799.28127725775?extraParams=%7B%22display_model_id%22%3A227432835764%2C%22model_selection_logic%22%3A3%7D&sp_atk=08fbea43-f385-4cff-a3a1-cc0318cc216e&xptdk=08fbea43-f385-4cff-a3a1-cc0318cc216e' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/1390164749822647/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3A16cca236-5c25-42bb-a129-8e7104b1d837' },
    ],
    featured: false
  },
  {
    id: '11', slug: 'watch', name: 'Watch', nameMs: 'Jam Tangan', image: '/images/products/watch.jpg', category: 'Vintage',
    description: 'Compare available external listings for watch across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk jam tangan di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/-CASIO-LTP-V005L-GL-CASIO-LADIES-CLASSIC-QUARTZ-WATCH-LEATHER-BAND-MODEL-i.255857246.23516455249?extraParams=%7B%22display_model_id%22%3A203679533399%2C%22model_selection_logic%22%3A3%7D&sp_atk=a76d3397-504c-4021-8e96-f3f7057f55f0&xptdk=a76d3397-504c-4021-8e96-f3f7057f55f0' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/mint-dec-2017-breitling-transocean-rb015253-bb16-black-1431253895/?t-id=ajrJM8exft_1775894123070&t-referrer_browse_type=search_results&t-referrer_context_ccid=256&t-referrer_page_type=certified_products&t-referrer_request_id=VwLdhtVYqhpBnyPY&t-referrer_search_query=watch%20leather&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=7' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/924080163665237/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3Ad94cf279-7c82-4038-a8bb-73515bb4bf51' },
    ],
    featured: false
  },
  {
    id: '12', slug: 'clock-pendulum', name: 'Clock Pendulum', nameMs: 'Jam Bandul', image: '/images/products/clock-pendulum.jpg', category: 'Vintage',
    description: 'Compare available external listings for clock pendulum across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk jam bandul di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://my.shp.ee/axLguw1H' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/vintage-german-junghans-old-pendulum-clock-1302089467/?t-id=ajrJM8exft_1775894123070&t-referrer_browse_type=search_results&t-referrer_page_type=search&t-referrer_request_id=cZEvQvQ2seMWaGSj&t-referrer_search_query=old%20clock%20pendulum&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=3' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/1445537050404655/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3Ac887d16c-e315-4f37-a462-97e15b95f262' },
    ],
    featured: false
  },
  {
    id: '13', slug: 'cd', name: 'CD', nameMs: 'CD', image: '/images/products/cd.jpg', category: 'Collectibles',
    description: 'Compare available external listings for cd across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk cd di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/retromusic_73#product_list' },
      { platform: 'Carousell', url: 'https://www.carousell.com.my/p/cd-lama-lagu-1202823787/' },
      { platform: 'Facebook', url: 'https://www.facebook.com/groups/882660121796248/' },
    ],
    featured: false
  },
  {
    id: '14', slug: 'trolley', name: 'Trolley', nameMs: 'Troli', image: '/images/products/trolley.jpg', category: 'Home & Decor',
    description: 'Compare available external listings for trolley across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk troli di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/%E3%80%90In-Stock%E3%80%91Stair-climbing-Artifact-Truck-Heavy-duty-Downstairs-Luggage-Trolley-Portable-Trolley-Foldable-Household-Small-Trolley-QCFK-i.1209539174.53355604233?extraParams=%7B%22display_model_id%22%3A267377168248%2C%22model_selection_logic%22%3A3%7D&sp_atk=c04707a3-25e5-4115-9446-2a229010e2bd&xptdk=c04707a3-25e5-4115-9446-2a229010e2bd' },
      { platform: 'Shopee', url: 'https://shopee.com.my/Super-Heavy-Duty-Foldable-Handle-Platform-Trolley-360%C2%B0-Rotation-Wheel-Moving-Items-Hand-Push-Cart-Troli-Letak-Barang-i.16228202.24411492154?extraParams=%7B%22display_model_id%22%3A217299734949%2C%22model_selection_logic%22%3A3%7D&sp_atk=62a34744-1ae8-498e-9cce-203c947aa964&xptdk=62a34744-1ae8-498e-9cce-203c947aa964' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/foldable-trolley-for-shopping-heavy-duty-universal-use-140kg-100kg-capacity-trolley-flatbed-trolley-cart-smart-cart-1406860183/?t-id=ajrJM8exft_1775894123070&t-referrer_browse_type=search_results&t-referrer_page_type=search&t-referrer_request_id=kyct3g63ZySTsPFK&t-referrer_search_query=Trolley&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=2' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/1061013702699807/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3A274dd0e3-6227-40b1-b698-e25b69266c10' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/978715854821398/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3A274dd0e3-6227-40b1-b698-e25b69266c10' },
    ],
    featured: false
  },
  {
    id: '15', slug: 'gasing', name: 'Gasing', nameMs: 'Gasing', image: '/images/products/gasing.jpg', category: 'Traditional Games',
    description: 'Compare available external listings for gasing across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk gasing di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/Handmade-Kayu-Meranti-Traditional-Gasing-Childhood-Toy-i.76128085.6108488059?extraParams=%7B%22display_model_id%22%3A13462872288%2C%22model_selection_logic%22%3A3%7D&rModelId=13462872288&sp_atk=083a9972-8e8d-4b06-b140-44ff4ce9056c&vItemId=54901258043&vModelId=325114245391&vShopId=1432004273&xptdk=083a9972-8e8d-4b06-b140-44ff4ce9056c' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/e506-gasing-kayu-spinning-top-1410245685/?t-id=ajrJM8exft_1775894123070&t-referrer_browse_type=search_results&t-referrer_page_type=search&t-referrer_request_id=pQfUQzkmSisfGu-t&t-referrer_search_query=Gasing&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=0' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/1594521961824741/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3Ad296e119-32bf-4af5-b7d9-e4b0cb00d33f' },
    ],
    featured: false
  },
  {
    id: '16', slug: 'coconut-grater', name: 'Coconut Grater', nameMs: 'Pemarut Kelapa', image: '/images/products/coconut-grater.jpg', category: 'Vintage',
    description: 'Compare available external listings for coconut grater across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk pemarut kelapa di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/Manual-folding-coconut-grater-traditional-coconut-grater-tool-WOODEN-SIZE-WOODEN-COCONUT-SIZE-UNIQUE-TRADITIONAL-FOLDING-SIZE-i.617040409.43504785355?extraParams=%7B%22display_model_id%22%3A295405037788%2C%22model_selection_logic%22%3A3%7D&sp_atk=c93e2695-5061-4a8d-9e30-aeaa82f6cbed&xptdk=c93e2695-5061-4a8d-9e30-aeaa82f6cbed' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/vintage-coconut-grater-tool-1351161047/?t-id=ajrJM8exft_1775894123070&t-referrer_browse_type=search_results&t-referrer_page_type=search&t-referrer_request_id=-63DhY-gxhgID_ww&t-referrer_search_query=Coconut%20Grater&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=4' },
    ],
    featured: false
  },
  {
    id: '17', slug: 'wayang-kulit', name: 'Wayang Kulit', nameMs: 'Wayang Kulit', image: '/images/products/wayang-kulit.jpg', category: 'Traditional Crafts',
    description: 'Compare available external listings for wayang kulit across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk wayang kulit di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/JANAKA-JANOKO-ARJUNA-PERMADI-paper-shadow-puppet-50-cm-i.414184811.42261103088?extraParams=%7B%22display_model_id%22%3A243695248274%2C%22model_selection_logic%22%3A3%7D&sp_atk=68e58bdb-f07a-4218-a7b4-0e9809f5d539&xptdk=68e58bdb-f07a-4218-a7b4-0e9809f5d539' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/wayang-kulit-cakil-goat-skin-1284082975/?t-id=ajrJM8exft_1775894123070&t-referrer_browse_type=search_results&t-referrer_page_type=search&t-referrer_request_id=cOCXNX9UHlb3-B3y&t-referrer_search_query=wayang%20kulit&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=2' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/1187462056684435/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3Ae554cf73-4149-4ab0-b03a-bd86df954414' },
    ],
    featured: false
  },
  {
    id: '18', slug: 'kotak', name: 'Kotak', nameMs: 'Kotak', image: '/images/products/kotak.jpg', category: 'Home & Decor',
    description: 'Compare available external listings for kotak across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk kotak di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/BigBigBox-10PCS-BUNDLE-Kotak-Besar-Pindah-Rumah-Moving-House-Box-Big-Size-Box-Big-RSC-%E6%90%AC%E5%AE%B6%E7%9B%92%E5%AD%90-i.1511619725.28634242065?extraParams=%7B%22display_model_id%22%3A168881157360%2C%22model_selection_logic%22%3A3%7D&sp_atk=f656b574-82a9-44de-9f73-c16c2be96fec&xptdk=f656b574-82a9-44de-9f73-c16c2be96fec' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/used-cardboard-boxes-45x40x40-10x-1431420429/?t-id=ajrJM8exft_1775894123070&t-referrer_browse_type=search_results&t-referrer_page_type=search&t-referrer_request_id=wEZl9nT8i12zGH0f&t-referrer_search_query=boxes&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=7' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/1615825446373419/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3A598b15bc-b2e1-4e2a-bcdd-870f719696e4' },
    ],
    featured: false
  },
  {
    id: '19', slug: 'bakery-tray', name: 'Bakery Tray', nameMs: 'Dulang Bakeri', image: '/images/products/bakery-tray.jpg', category: 'Home & Decor',
    description: 'Compare available external listings for bakery tray across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk dulang bakeri di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/CENTURY-BAKERY-CAKE-BREAD-FOOD-TRAY-16.5L-6908C-6908-6908T-COVER-6910-i.44177645.6044370100?extraParams=%7B%22display_model_id%22%3A255359376047%2C%22model_selection_logic%22%3A3%7D&sp_atk=dbdf047b-ea9f-429b-8ed2-95a52b75d6b1&xptdk=dbdf047b-ea9f-429b-8ed2-95a52b75d6b1' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/food-tray-bakery-tray-dough-tray-1395741560/?t-id=ajrJM8exft_1775894123070&t-referrer_browse_type=search_results&t-referrer_page_type=search&t-referrer_request_id=7hVCdtmQhfChsij6&t-referrer_search_query=Bakery%20tray&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=0' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/773084668994323/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3A641dbb75-c106-4871-b3ee-87d5aa3e50e5' },
    ],
    featured: false
  },
  {
    id: '20', slug: 'plate', name: 'Plate', nameMs: 'Pinggan', image: '/images/products/plate.jpg', category: 'Home & Decor',
    description: 'Compare available external listings for plate across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk pinggan di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/OPAL-GLASS-ROUND-PLATE-(LOOSE-ITEMS)-i.81032036.2272010592?extraParams=%7B%22display_model_id%22%3A149230115980%2C%22model_selection_logic%22%3A3%7D&sp_atk=bee25947-3b03-4f8f-81c2-a046ad46c873&xptdk=bee25947-3b03-4f8f-81c2-a046ad46c873' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/vintage-pyrex-jaj-june-rose-milk-glass-oval-plate-1418062307/?t-id=ajrJM8exft_1775894123070&t-referrer_browse_type=search_results&t-referrer_page_type=search&t-referrer_request_id=7RGNe7uQSrSYPIKR&t-referrer_search_query=plate%20glass&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=21' },
    ],
    featured: false
  },
  {
    id: '21', slug: 'old-coins', name: 'Old coins', nameMs: 'Syiling Lama', image: '/images/products/old-coins.jpg', category: 'Collectibles',
    description: 'Compare available external listings for old coins across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk syiling lama di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/old-coin-Malaysia-%F0%9F%87%B2%F0%9F%87%BE-1-Bunga-Raya-i.281241211.29223398968?extraParams=%7B%22display_model_id%22%3A89088170915%2C%22model_selection_logic%22%3A3%7D&sp_atk=5ee21f67-4e2a-4635-8ae4-5a6d921bab7e&xptdk=5ee21f67-4e2a-4635-8ae4-5a6d921bab7e' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/10x-1-malaysia-1-ringgit-1971-old-used-circulated-1st-first-series-parliament-building-coins-1427388830/?t-id=pFRCwxTMdM_1775986498997&t-referrer_browse_type=search_results&t-referrer_page_type=search&t-referrer_request_id=jPAZbRAFtofrtdlu&t-referrer_search_query=old%20coins&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=10' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/816576071395173/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3Afc0dd938-d5fb-48e6-93d3-9eb127521f06' },
    ],
    featured: false
  },
  {
    id: '22', slug: 'old-phone', name: 'Old phone', nameMs: 'Telefon Lama', image: '/images/products/old-phone.jpg', category: 'Vintage',
    description: 'Compare available external listings for old phone across the marketplaces shown below. Availability, condition and price are set by each external seller.',
    descriptionMs: 'Bandingkan senarai luaran yang tersedia untuk telefon lama di platform yang ditunjukkan di bawah. Ketersediaan, keadaan dan harga ditetapkan oleh setiap penjual luar.',
    links: [
      { platform: 'Shopee', url: 'https://shopee.com.my/READY-STOCK-NOKIA-1110-WITH-A-FULL-BOX-INCLUDING-CHARGER-i.191740354.28635929203?extraParams=%7B%22display_model_id%22%3A108681654927%2C%22model_selection_logic%22%3A3%7D&sp_atk=74629e42-2248-44e9-9056-d6279e7535e2&xptdk=74629e42-2248-44e9-9056-d6279e7535e2' },
      { platform: 'Carousell', url: 'https://www.carousell.sg/p/old-nokia-mobile-phone-1411722220/?t-id=pFRCwxTMdM_1775986498997&t-referrer_browse_type=search_results&t-referrer_page_type=search&t-referrer_request_id=1wQCuBErGvRcSM83&t-referrer_search_query=old%20phone&t-referrer_search_query_source=direct_search&t-referrer_sort_by=popular&t-tap_index=1' },
      { platform: 'Facebook', url: 'https://www.facebook.com/marketplace/item/969386702412893/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3Aaec3ddc3-5307-4db8-8412-951068914f25' },
    ],
    featured: false
  },
];

export const uniquePlatforms = (product: Product) => [...new Set(product.links.map(link => link.platform))];
