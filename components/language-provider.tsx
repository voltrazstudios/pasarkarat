'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ARCHIVE_TEXT_MS } from '@/data/archive-text-ms';

export type SiteLanguage = 'en' | 'ms';
const STORAGE_KEY = 'pasar-karat-language';

const EN_TO_MS: Record<string, string> = {
  ...ARCHIVE_TEXT_MS,
  'Old treasures. New discoveries.': 'Khazanah lama. Penemuan baharu.',
  'A little piece of Malaysia, wherever you are.': 'Secebis Malaysia, di mana sahaja anda berada.',
  'Home': 'Utama', 'Collection': 'Koleksi', 'Archive': 'Arkib', 'Virtual Experience': 'Pengalaman Maya', 'Experience': 'Pengalaman', 'About': 'Tentang', 'Saved': 'Disimpan',
  'Explore Collection': 'Terokai Koleksi', 'Browse all items': 'Lihat semua item', 'Featured finds': 'Pilihan istimewa',
  'Explore the collection': 'Terokai koleksi', 'View all items': 'Lihat semua item', 'More to discover': 'Lebih banyak untuk diterokai',
  'View Item': 'Lihat Item', 'View at Seller': 'Lihat di Penjual', 'Back to collection': 'Kembali ke koleksi',
  'You might also like': 'Anda mungkin juga suka', 'CONTINUE YOUR DISCOVERY': 'TERUSKAN PENEMUAN ANDA',
  'FOLLOW YOUR CURIOSITY': 'IKUT RASA INGIN TAHU ANDA', 'Find your kind of treasure': 'Temui khazanah pilihan anda',
  'WORTH A CLOSER LOOK': 'WAJAR DILIHAT LEBIH DEKAT', 'KEEP EXPLORING': 'TERUSKAN MENEROKA',
  'THE DIGITAL PASAR KARAT': 'PASAR KARAT DIGITAL',
  'All items': 'Semua item', 'No treasures found just yet': 'Belum ada khazanah ditemui', 'Reset filters': 'Tetapkan semula penapis',
  'Try another search or explore a different category.': 'Cuba carian lain atau terokai kategori yang berbeza.',
  'Example listings · MYR': 'Senarai contoh · MYR', 'Image coming soon': 'Imej akan datang',
  'A space for stories & discoveries': 'Ruang untuk cerita & penemuan', 'Your Pasar Karat collection, pictured here.': 'Koleksi Pasar Karat anda, dipaparkan di sini.',
  'THE SPIRIT OF PASAR KARAT, ONLINE': 'SEMANGAT PASAR KARAT, DALAM TALIAN',
  'Discover Unique Finds': 'Temui Barangan Unik', 'Explore vintage items, antiques, traditional crafts and collectibles from independent sellers.': 'Terokai barangan vintaj, antik, kraf tradisional dan koleksi daripada penjual bebas.',
  'Vintage charm': 'Pesona vintaj', 'Local heritage': 'Warisan tempatan', 'Everyday discoveries': 'Penemuan harian',
  'A new chapter for old treasures': 'Bab baharu untuk khazanah lama', 'Find something with a story.': 'Temui sesuatu yang mempunyai cerita.',
  'MORE THAN SOMETHING OLD': 'LEBIH DARIPADA SEKADAR BARANG LAMA', 'Get to know Pasar Karat': 'Kenali Pasar Karat',
  'Product': 'Produk', 'About the Marketplace': 'Tentang Pasaran', 'Legal': 'Perundangan',
  'Privacy Policy': 'Dasar Privasi', 'Terms of Service': 'Terma Perkhidmatan', 'All rights reserved.': 'Hak cipta terpelihara.',
  'Save': 'Simpan', 'Your Saved Finds': 'Penemuan Disimpan Anda', 'No saved finds yet': 'Belum ada penemuan disimpan',
  'Keep track of the treasures that caught your eye.': 'Simpan jejak khazanah yang menarik perhatian anda.',
  'Explore the collection and save the treasures you’d like to revisit.': 'Terokai koleksi dan simpan khazanah yang ingin anda lihat semula.',
  'Explore the collection and save the treasures you\'d like to revisit.': 'Terokai koleksi dan simpan khazanah yang ingin anda lihat semula.',
  'Loading saved finds…': 'Memuatkan penemuan disimpan…',
  'Back to Archive': 'Kembali ke Arkib', 'MALAYSIAN DIGITAL ARCHIVE': 'ARKIB DIGITAL MALAYSIA', 'PASAR KARAT LIVING ARCHIVE': 'ARKIB HIDUP PASAR KARAT',
  'Overview': 'Gambaran Keseluruhan', 'Origin': 'Asal Usul', 'Cultural Significance': 'Kepentingan Budaya',
  'Materials / Characteristics': 'Bahan / Ciri-ciri', 'Interesting Facts': 'Fakta Menarik', 'Further Reading': 'Bacaan Lanjut',
  'Related Archive Entries': 'Entri Arkib Berkaitan', 'Learn More': 'Ketahui Lebih Lanjut',
  'LIVING HERITAGE': 'WARISAN HIDUP', 'Community Memories': 'Memori Komuniti', 'Share Your Memory': 'Kongsi Memori Anda',
  'What does this heritage remind you of?': 'Apakah yang warisan ini mengingatkan anda?', 'Your name': 'Nama anda', '(optional)': '(pilihan)',
  'Your memory': 'Memori anda', 'Share Memory': 'Kongsi Memori', 'Sharing…': 'Sedang berkongsi…',
  'Loading community memories…': 'Memuatkan memori komuniti…', 'Anonymous visitor': 'Pelawat tanpa nama',
  'Be the first to share a memory.': 'Jadilah orang pertama berkongsi memori.',
  'Personal stories help this archive grow beyond facts and objects.': 'Cerita peribadi membantu arkib ini berkembang melangkaui fakta dan objek.',
  'Community memories are personal contributions and may not be historically verified.': 'Memori komuniti ialah sumbangan peribadi dan mungkin tidak disahkan secara sejarah.',
  'Thank you for adding your memory to the living archive.': 'Terima kasih kerana menambah memori anda ke arkib hidup.',
  'Keep it respectful — no links, swearing, spam or personal contact details.': 'Pastikan sopan — tiada pautan, kata kesat, spam atau maklumat hubungan peribadi.',
  'Example: My grandparents had one like this at home...': 'Contoh: Datuk dan nenek saya pernah mempunyai benda seperti ini di rumah...',
  'Please write at least 8 characters.': 'Sila tulis sekurang-kurangnya 8 aksara.',
  'Please keep your memory under 500 characters.': 'Sila pastikan memori anda di bawah 500 aksara.',
  'Links are not allowed in Community Memories.': 'Pautan tidak dibenarkan dalam Memori Komuniti.',
  'Please do not share email addresses or phone numbers in Community Memories.': 'Sila jangan kongsi alamat e-mel atau nombor telefon dalam Memori Komuniti.',
  'Please keep Community Memories respectful and free from offensive language.': 'Sila pastikan Memori Komuniti sopan dan bebas daripada bahasa kesat.',
  'This looks like spam. Please write a genuine personal memory.': 'Ini kelihatan seperti spam. Sila tulis memori peribadi yang sebenar.',
  'Please wait one minute before sharing another memory.': 'Sila tunggu satu minit sebelum berkongsi memori lain.',
  'You have shared several memories recently. Please try again later.': 'Anda telah berkongsi beberapa memori baru-baru ini. Sila cuba lagi kemudian.',
  'You already shared this memory. Please write something different.': 'Anda telah berkongsi memori ini. Sila tulis sesuatu yang berbeza.',
  'Community Memories are temporarily unavailable.': 'Memori Komuniti tidak tersedia buat sementara waktu.',
  'Your memory could not be shared.': 'Memori anda tidak dapat dikongsi.',
  'IMMERSIVE DIGITAL HERITAGE': 'WARISAN DIGITAL IMERSIF', 'Step Into': 'Melangkah Masuk', 'Experience on itch.io': 'Alami di itch.io',
  'Discover the Experience': 'Terokai Pengalaman', 'THE MARKET BEYOND THE SCREEN': 'PASARAN DI SEBALIK SKRIN', 'Explore. Interact. Discover.': 'Terokai. Berinteraksi. Temui.',
  'A FAMILIAR PLACE. A NEW PERSPECTIVE.': 'TEMPAT YANG BIASA. PERSPEKTIF BAHARU.', 'Explore Malaysia’s': 'Terokai', 'Market Heritage in 3D': 'Warisan Pasar Malaysia dalam 3D',
  'Explore the Market': 'Terokai Pasar', 'Discover Heritage': 'Temui Warisan', 'Interactive Experience': 'Pengalaman Interaktif',
  'HERITAGE DISCOVERY COLLECTION': 'KOLEKSI PENEMUAN WARISAN', 'Your Heritage Gallery': 'Galeri Warisan Anda', 'Discovered': 'Ditemui',
  'Undiscovered': 'Belum Ditemui', 'Discover Its Story': 'Temui Ceritanya',
  'Explore the Virtual Experience': 'Terokai Pengalaman Maya', 'Loading Heritage Gallery…': 'Memuatkan Galeri Warisan…',
  'A WINDOW INTO THE VIRTUAL MARKET': 'JENDELA KE PASAR MAYA', 'Inside the Experience': 'Di Dalam Pengalaman',
  'A glimpse of what you can explore in the virtual Pasar Karat.': 'Sekilas pandang perkara yang boleh anda terokai dalam Pasar Karat maya.',
  'THE OBJECTS. THE ATMOSPHERE. THE STORIES.': 'OBJEK. SUASANA. CERITA.', 'More Than': 'Lebih Daripada', 'a Marketplace': 'sebuah Pasaran',
  'READY TO EXPLORE PASAR KARAT?': 'SEDIA UNTUK MENEROKAI PASAR KARAT?', 'Visit the Virtual Experience': 'Lawati Pengalaman Maya',
  'Opens on itch.io in a new tab': 'Dibuka di itch.io dalam tab baharu',
  'A MALAYSIAN MARKET SPIRIT': 'SEMANGAT PASAR MALAYSIA', 'New discoveries.': 'Penemuan baharu.', 'A place to browse, a story to find.': 'Tempat untuk meneroka, cerita untuk ditemui.',
  'How it works': 'Cara ia berfungsi', 'Get in Touch': 'Hubungi Kami', 'Email': 'E-mel', 'Phone': 'Telefon', 'Connect on LinkedIn': 'Hubungi di LinkedIn',
  'Name *': 'Nama *', 'Email *': 'E-mel *', 'Subject *': 'Subjek *', 'Message *': 'Mesej *', 'Send Message': 'Hantar Mesej', 'Sending…': 'Sedang menghantar…',
  'Thank you! Your message has been sent.': 'Terima kasih! Mesej anda telah dihantar.',
  'Want to Feature Your Product?': 'Mahu Paparkan Produk Anda?', 'Submit Your Product': 'Hantar Produk Anda',
  'Know Something We Should Preserve?': 'Tahu Sesuatu Yang Patut Kami Pelihara?', 'Suggest an Archive Entry': 'Cadangkan Entri Arkib',
  'SELLER / PLATFORM': 'PENJUAL / PLATFORM', 'Purchases are completed on the external seller’s website.': 'Pembelian diselesaikan di laman web penjual luar.',
  'Search collection': 'Cari koleksi', 'Clear search': 'Kosongkan carian', 'Find your next discovery...': 'Cari penemuan anda seterusnya...',
  'Skip to content': 'Langkau ke kandungan', 'Open navigation menu': 'Buka menu navigasi', 'Close navigation menu': 'Tutup menu navigasi',
  'English': 'Bahasa Inggeris', 'Malay': 'Bahasa Melayu',
  'from': 'dari',
  'Pasar Karat': 'Pasar Karat',
  'A market full of character.': 'Pasar yang penuh dengan karakter.',
  'A connection to our heritage.': 'Hubungan dengan warisan kita.',
  'From a radio that brings back memories to a craft that carries tradition, Pasar Karat is a place for curious discoveries. We bring that spirit online, helping you find vintage, traditional and collectible items from independent sellers.': 'Daripada radio yang mengimbau kenangan hingga kraf yang membawa tradisi, Pasar Karat ialah tempat untuk penemuan yang menarik. Kami membawa semangat itu ke dalam talian, membantu anda menemui barangan vintaj, tradisional dan koleksi daripada penjual bebas.',
  'Preview collection · Example products and prices. Seller links are placeholders.': 'Pratonton koleksi · Produk dan harga adalah contoh. Pautan penjual ialah pemegang tempat.',
  'A little nostalgia. A touch of tradition. Something that speaks to you.': 'Sedikit nostalgia. Sentuhan tradisi. Sesuatu yang dekat di hati anda.',
  'Example listing: this button opens a placeholder URL, not a purchasable product. Real seller links will be added later.': 'Senarai contoh: butang ini membuka URL pemegang tempat, bukan produk yang boleh dibeli. Pautan penjual sebenar akan ditambah kemudian.',
  'Purchases are completed on the external seller\'s website.': 'Pembelian diselesaikan di laman web penjual luar.',
  'Your message could not be sent. Please try again or contact us by email. Your message is still here.': 'Mesej anda tidak dapat dihantar. Sila cuba lagi atau hubungi kami melalui e-mel. Mesej anda masih ada di sini.',
  'Have a question, collaboration idea, seller enquiry or feedback about Pasar Karat Digital Heritage? We\'d love to hear from you.': 'Ada soalan, idea kerjasama, pertanyaan penjual atau maklum balas tentang Pasar Karat Digital Heritage? Kami ingin mendengar daripada anda.',
  'Pasar Karat Digital Marketplace helps curious people discover vintage, traditional and collectible products from independent sellers and external marketplaces.': 'Pasar Karat Digital Marketplace membantu orang ramai menemui produk vintaj, tradisional dan koleksi daripada penjual bebas serta pasaran luar.',
  'Inspired by Malaysia’s Pasar Karat markets, this collection brings together antiques, crafts, everyday nostalgia and objects with character. Browse by category, search for a favourite find, or explore something unexpected.': 'Diilhamkan oleh pasar karat di Malaysia, koleksi ini menghimpunkan barangan antik, kraf, nostalgia harian dan objek yang mempunyai karakter. Layari mengikut kategori, cari barangan kegemaran atau terokai sesuatu yang tidak dijangka.',
  'Explore our collection, open an item to learn more, then follow “View at Seller” to the external seller’s website. Purchases are completed there. Check the seller’s current price, availability, shipping and return terms before buying.': 'Terokai koleksi kami, buka item untuk mengetahui lebih lanjut, kemudian pilih “Lihat di Penjual” untuk ke laman web penjual luar. Pembelian diselesaikan di sana. Semak harga semasa, ketersediaan, penghantaran dan syarat pemulangan penjual sebelum membeli.',
  'This V1 collection uses example products, prices and seller links. The images and real listings will be added later.': 'Koleksi V1 ini menggunakan produk, harga dan pautan penjual contoh. Imej dan senarai sebenar akan ditambah kemudian.',
  'Step Into Pasar Karat': 'Melangkah Masuk ke Pasar Karat',
  'Explore a digitally recreated Malaysian Pasar Karat and discover its heritage, objects and atmosphere through an interactive 3D experience.': 'Terokai Pasar Karat Malaysia yang dicipta semula secara digital dan temui warisan, objek serta suasananya melalui pengalaman 3D interaktif.',
  'Explore Malaysia’s Market Heritage in 3D': 'Terokai Warisan Pasar Malaysia dalam 3D',
  'Wander through a digital Pasar Karat, interact with heritage objects and experience the atmosphere of Malaysia’s iconic flea-market culture in a virtual environment.': 'Jelajahi Pasar Karat digital, berinteraksi dengan objek warisan dan rasai suasana budaya pasar karat ikonik Malaysia dalam persekitaran maya.',
  'Walk through a detailed digital recreation of Pasar Karat and explore its stalls, objects and surroundings.': 'Berjalan melalui rekreasi digital Pasar Karat yang terperinci dan terokai gerai, objek serta persekitarannya.',
  'Interact with traditional items and discover the stories and cultural significance behind them.': 'Berinteraksi dengan barangan tradisional dan temui cerita serta kepentingan budaya di sebaliknya.',
  'Experience Malaysian market heritage through exploration, interaction and digital storytelling.': 'Alami warisan pasar Malaysia melalui penerokaan, interaksi dan penceritaan digital.',
  'Discover heritage objects inside the virtual Pasar Karat to unlock their stories here.': 'Temui objek warisan di dalam Pasar Karat maya untuk membuka cerita mereka di sini.',
  'Find this heritage object inside the Virtual Experience.': 'Cari objek warisan ini di dalam Pengalaman Maya.',
  'Pasar Karat Digital Heritage brings the atmosphere and cultural identity of Pasar Karat into an interactive digital environment. The experience allows visitors to explore, interact and discover heritage in a way that complements the real-world marketplace.': 'Pasar Karat Digital Heritage membawa suasana dan identiti budaya Pasar Karat ke dalam persekitaran digital interaktif. Pengalaman ini membolehkan pengunjung meneroka, berinteraksi dan menemui warisan dengan cara yang melengkapi pasaran dunia sebenar.',
  'Experience the Market.': 'Alami Pasar.',
  'Keep the Stories Alive.': 'Hidupkan Ceritanya.',
  'Explore the Pasar Karat virtual experience and discover Malaysia’s market heritage in an interactive digital environment.': 'Terokai pengalaman maya Pasar Karat dan temui warisan pasar Malaysia dalam persekitaran digital interaktif.',
  'Already Discovered': 'Sudah Ditemui',
  'Heritage Discovered!': 'Warisan Ditemui!',
  'Discovery code not recognized.': 'Kod penemuan tidak dikenali.',
  'Discovery could not be saved.': 'Penemuan tidak dapat disimpan.',
  'Allow browser storage, then open the discovery link again.': 'Benarkan storan pelayar, kemudian buka semula pautan penemuan.',
  'Loading discovery…': 'Memuatkan penemuan…',
  'Remove': 'Alih keluar',
  'Browser storage is unavailable. Saved finds will only last for this visit.': 'Storan pelayar tidak tersedia. Penemuan yang disimpan hanya akan kekal untuk lawatan ini.',
  'Some external links may be affiliate links. Pasar Karat Digital Marketplace may receive a commission from qualifying purchases.': 'Sesetengah pautan luar mungkin merupakan pautan afiliasi. Pasar Karat Digital Marketplace mungkin menerima komisen daripada pembelian yang layak.',
  '© 2026 Voltraz Studios. All rights reserved.': '© 2026 Voltraz Studios. Hak cipta terpelihara.',
  'Traditional Food': 'Makanan Tradisional', 'Traditional Clothing & Textiles': 'Pakaian & Tekstil Tradisional', 'Traditional Games': 'Permainan Tradisional',
  'Traditional Music & Instruments': 'Muzik & Alat Muzik Tradisional', 'Arts & Crafts': 'Seni & Kraf', 'Heritage Objects': 'Objek Warisan',
  'Architecture & Landmarks': 'Seni Bina & Mercu Tanda', 'Places & Communities': 'Tempat & Komuniti', 'Nature & Wildlife': 'Alam Semula Jadi & Hidupan Liar',
  'Festivals & Traditions': 'Perayaan & Tradisi', 'Local Brands & Products': 'Jenama & Produk Tempatan', 'Transport & Mobility': 'Pengangkutan & Mobiliti',
  'Stories & Folklore': 'Cerita & Cerita Rakyat', 'Other': 'Lain-lain',
  'Vintage': 'Vintaj', 'Antiques': 'Antik', 'Traditional Crafts': 'Kraf Tradisional', 'Electronics': 'Elektronik', 'Collectibles': 'Koleksi', 'Clothing': 'Pakaian', 'Home & Decor': 'Rumah & Hiasan',
  'Vintage Radio': 'Radio Vintaj',
  'Vintage Camera': 'Kamera Vintaj',
  'Brass Teapot': 'Teko Tembaga',
  'Wooden Congkak': 'Congkak Kayu',
  'Antique Lantern': 'Tanglung Antik',
  'Vintage Vinyl Record': 'Piring Hitam Vintaj',
  'Vintage Comic': 'Komik Vintaj',
  'Woven Craft Basket': 'Bakul Kraf Anyaman',
  'Retro Cassette Player': 'Pemain Kaset Retro',
  'Batik Shirt': 'Kemeja Batik',
  'Decorative Ceramic Vase': 'Pasu Seramik Hiasan',
  'Example independent seller': 'Penjual bebas contoh',
  'Example external marketplace': 'Pasaran luar contoh',
  'Example craft seller': 'Penjual kraf contoh',
  'Example record seller': 'Penjual rekod contoh',
  'Example book seller': 'Penjual buku contoh',
  'Example electronics seller': 'Penjual elektronik contoh',
  'Example clothing seller': 'Penjual pakaian contoh',
  'Example homeware seller': 'Penjual barangan rumah contoh',
  'A nostalgic tabletop radio with the character of a well-loved living room companion. This example listing shows how you can present a vintage find. Confirm working condition, dimensions and availability with the seller.': 'Radio meja bernostalgia yang membawa karakter sebuah benda kesayangan di ruang tamu. Senarai contoh ini menunjukkan cara barangan vintaj boleh dipersembahkan. Sahkan keadaan fungsi, ukuran dan ketersediaan dengan penjual.',
  'A classic film camera for collectors and lovers of analogue photography. This is an example listing; lens condition, shutter operation and included accessories should be confirmed on the seller’s page.': 'Kamera filem klasik untuk pengumpul dan peminat fotografi analog. Ini ialah senarai contoh; keadaan lensa, fungsi pengatup dan aksesori yang disertakan perlu disahkan di halaman penjual.',
  'A decorative brass teapot with a timeless silhouette. An example of the metalwork you might discover at a heritage market. Age, provenance and suitability for food use must be verified with the seller.': 'Teko tembaga hiasan dengan bentuk yang kekal klasik. Contoh kerja logam yang mungkin ditemui di pasar warisan. Usia, asal-usul dan kesesuaian untuk kegunaan makanan perlu disahkan dengan penjual.',
  'Rediscover the rhythm of a traditional game with a wooden congkak board. This example listing celebrates a familiar Malaysian pastime. Check the board dimensions and whether playing pieces are included with the seller.': 'Temui semula rentak permainan tradisional dengan papan congkak kayu. Senarai contoh ini meraikan permainan yang dekat dengan rakyat Malaysia. Semak ukuran papan dan sama ada buah congkak disertakan dengan penjual.',
  'A lantern with old-world charm for a collected interior. This is an illustrative listing. Please verify age, materials and condition before purchasing from a real seller.': 'Tanglung dengan pesona klasik untuk ruang dalaman yang berkarakter. Ini ialah senarai ilustrasi. Sila sahkan usia, bahan dan keadaan sebelum membeli daripada penjual sebenar.',
  'A little analogue nostalgia for your record shelf. Replace this example with an actual artist, album, pressing and condition grade when your seller listing is ready.': 'Sedikit nostalgia analog untuk rak rekod anda. Gantikan contoh ini dengan artis, album, cetakan dan gred keadaan sebenar apabila senarai penjual anda sedia.',
  'The distinctive gourd-shaped pottery associated with Sayong, Perak. This sample listing provides space for an artisan’s story, dimensions and care instructions. Confirm the maker and intended use with the seller.': 'Tembikar berbentuk labu yang sinonim dengan Sayong, Perak. Senarai contoh ini menyediakan ruang untuk kisah pengkarya, ukuran dan arahan penjagaan. Sahkan pembuat dan tujuan penggunaan dengan penjual.',
  'A nostalgic addition to a collector’s bookshelf. Replace this sample with the comic title, issue number, language, publication year and a clear account of its condition.': 'Tambahan bernostalgia untuk rak buku pengumpul. Gantikan contoh ini dengan tajuk komik, nombor keluaran, bahasa, tahun penerbitan dan penerangan jelas tentang keadaannya.',
  'A woven basket that brings traditional craft into everyday spaces. This sample listing can be replaced with a real maker’s materials, weaving technique and dimensions.': 'Bakul anyaman yang membawa kraf tradisional ke ruang harian. Senarai contoh ini boleh digantikan dengan bahan, teknik anyaman dan ukuran daripada pembuat sebenar.',
  'A portable cassette player for an analogue listening ritual. Example listing only; confirm playback, battery compartment condition and accessories with the seller.': 'Pemain kaset mudah alih untuk pengalaman mendengar secara analog. Senarai contoh sahaja; sahkan fungsi main balik, keadaan ruang bateri dan aksesori dengan penjual.',
  'A batik shirt with an expressive pattern for everyday occasions. Update this example with the actual fabric, measurements, care instructions and condition.': 'Kemeja batik bercorak ekspresif untuk kegunaan harian. Kemas kini contoh ini dengan fabrik, ukuran, arahan penjagaan dan keadaan sebenar.',
  'A ceramic accent for a thoughtfully collected home. This sample listing is ready for a real seller’s dimensions, material details and condition notes.': 'Sentuhan seramik untuk kediaman yang dihias dengan teliti. Senarai contoh ini sedia diisi dengan ukuran, butiran bahan dan catatan keadaan daripada penjual sebenar.',
  'A familiar object from the world of analogue listening.': 'Objek yang biasa dikenali daripada dunia pendengaran analog.',
  'A traditional board game of counting and thoughtful moves.': 'Permainan papan tradisional yang melibatkan pengiraan dan langkah yang terancang.',
  'A traditional form of pottery associated with Sayong, Perak.': 'Bentuk tembikar tradisional yang dikaitkan dengan Sayong, Perak.',
  'An object that invites a closer look at traditional craftsmanship.': 'Objek yang mengajak kita melihat lebih dekat seni pertukangan tradisional.',
  'A stone mortar and pestle used to grind and pound ingredients.': 'Lesung dan alu batu yang digunakan untuk mengisar dan menumbuk bahan.',
  'A public telephone booth and a reminder of shared communication spaces.': 'Pondok telefon awam yang mengingatkan kita kepada ruang komunikasi bersama.',
  'This old radio invites you to think about the sounds of everyday life: music, conversation and shared listening. Look closely at its controls and imagine the stories a well-used object might carry.': 'Radio lama ini mengajak anda memikirkan bunyi kehidupan seharian: muzik, perbualan dan pengalaman mendengar bersama. Lihat dengan teliti kawalannya dan bayangkan cerita yang mungkin dibawa oleh objek yang telah lama digunakan.',
  'A congkak board turns simple playing pieces into a shared game. Take a closer look at its rows of hollows and consider how familiar games can connect people across generations.': 'Papan congkak mengubah buah permainan yang ringkas menjadi permainan bersama. Lihat dengan lebih dekat deretan lubangnya dan fikirkan bagaimana permainan yang dikenali boleh menghubungkan manusia merentas generasi.',
  'The distinctive gourd-shaped form of Labu Sayong makes it a memorable pottery object. This discovery is an invitation to explore the craft, materials and everyday uses behind the pieces found in a market.': 'Bentuk Labu Sayong yang menyerupai labu menjadikannya objek tembikar yang mudah dikenali. Penemuan ini mengajak anda meneroka kraf, bahan dan kegunaan harian di sebalik barangan yang ditemui di pasar.',
  'Look at the form and detailing of the keris in the virtual market. This short introduction leaves room for a fuller, reviewed account of its craftsmanship and cultural context.': 'Perhatikan bentuk dan perincian keris di pasar maya. Pengenalan ringkas ini membuka ruang untuk penerangan yang lebih lengkap dan disemak tentang pertukangan serta konteks budayanya.',
  'Lesung Batu brings attention to the tools of everyday cooking. Its bowl and pestle invite us to notice the practical objects behind familiar food and kitchen routines.': 'Lesung Batu memberi perhatian kepada alat memasak harian. Lesung dan alunya mengajak kita menghargai objek praktikal di sebalik makanan dan rutin dapur yang biasa.',
  'A telephone booth recalls a time when making a call could mean stepping into a shared public space. Explore this object as a small part of the changing streetscape and everyday life.': 'Pondok telefon mengimbau zaman apabila membuat panggilan bermakna memasuki ruang awam yang dikongsi. Terokai objek ini sebagai sebahagian kecil daripada perubahan landskap jalan dan kehidupan seharian.',

  'Gourd-shaped pottery associated with Sayong, Perak.': 'Tembikar berbentuk labu yang dikaitkan dengan Sayong, Perak.',
  'Labu Sayong introduces the relationship between craft and everyday objects. Its rounded body and narrow neck give this pottery a distinctive silhouette.': 'Labu Sayong memperkenalkan hubungan antara kraf dan objek harian. Badannya yang bulat dan lehernya yang sempit memberikan tembikar ini bentuk yang tersendiri.',
  'Sayong, Perak, Malaysia.': 'Sayong, Perak, Malaysia.',
  'An invitation to explore local pottery traditions and the skills behind familiar household objects.': 'Satu jemputan untuk meneroka tradisi tembikar tempatan dan kemahiran di sebalik objek rumah yang biasa dikenali.',
  'Gourd-shaped body': 'Badan berbentuk labu',
  'Narrow neck': 'Leher sempit',
  'Pottery form': 'Bentuk tembikar',
  'A traditional board game built around counting and thoughtful moves.': 'Permainan papan tradisional yang berasaskan pengiraan dan langkah yang terancang.',
  'A congkak board uses rows of hollows and small playing pieces. Exploring the board offers a starting point for learning about a shared game and the decisions made with each turn.': 'Papan congkak menggunakan deretan lubang dan buah permainan kecil. Meneroka papan ini menjadi titik permulaan untuk mempelajari permainan bersama serta keputusan yang dibuat pada setiap giliran.',
  'Games offer a way to spend time together and pass familiar pastimes between generations.': 'Permainan memberi ruang untuk meluangkan masa bersama dan mewariskan aktiviti yang dikenali antara generasi.',
  'Rows of playing hollows': 'Deretan lubang permainan',
  'Small pieces moved around a board': 'Buah kecil yang digerakkan di atas papan',
  'Lesung Batu brings attention to the practical tools of everyday cooking. A bowl-shaped mortar holds ingredients while a pestle is used to crush or grind them.': 'Lesung Batu menonjolkan alat praktikal dalam masakan harian. Lesung berbentuk mangkuk memegang bahan manakala alu digunakan untuk menumbuk atau mengisarnya.',
  'Kitchen tools connect everyday routines with the preparation of familiar food.': 'Alat dapur menghubungkan rutin harian dengan penyediaan makanan yang biasa dikenali.',
  'Stone mortar': 'Lesung batu',
  'Handheld pestle': 'Alu tangan',
  'The mortar and pestle are used together.': 'Lesung dan alu digunakan bersama.',
  'An old radio and a window into the experience of analogue listening.': 'Radio lama yang membuka jendela kepada pengalaman mendengar secara analog.',
  'Look closely at the tuning dial, speaker and controls of an old radio. These details offer a way to think about how people listened to music, news and conversation.': 'Perhatikan dengan teliti tombol penalaan, pembesar suara dan kawalan radio lama. Perincian ini membantu kita membayangkan bagaimana orang dahulu mendengar muzik, berita dan perbualan.',
  'An everyday object can carry personal memories of listening at home and sharing favourite programmes.': 'Objek harian boleh membawa kenangan peribadi tentang mendengar di rumah dan berkongsi rancangan kegemaran.',
  'Tuning controls': 'Kawalan penalaan',
  'Speaker enclosure': 'Kotak pembesar suara',
  'Handwoven fabric distinguished by decorative supplementary threads.': 'Fabrik tenunan tangan yang dikenali melalui benang tambahan hiasan.',
  'Songket uses extra decorative threads woven into a base fabric to create patterned surfaces. Gold- or silver-coloured threads are characteristic of the technique.': 'Songket menggunakan benang hiasan tambahan yang ditenun ke dalam fabrik asas untuk menghasilkan permukaan bercorak. Benang berwarna emas atau perak merupakan ciri teknik ini.',
  'Songket is worn for ceremonial and festive occasions, including weddings. Weaving knowledge is passed between generations.': 'Songket dipakai untuk acara istiadat dan perayaan, termasuk majlis perkahwinan. Pengetahuan menenun diwariskan antara generasi.',
  'Handwoven textile': 'Tekstil tenunan tangan',
  'Decorative supplementary threads': 'Benang tambahan hiasan',
  'Geometric and nature-inspired patterns': 'Corak geometri dan ilham alam',
  'Malaysia’s songket tradition was inscribed on UNESCO’s Representative List of the Intangible Cultural Heritage of Humanity in 2021.': 'Tradisi songket Malaysia telah disenaraikan dalam Senarai Perwakilan Warisan Budaya Tidak Ketara Kemanusiaan UNESCO pada tahun 2021.',

  'UNESCO inscribed Malaysia’s songket tradition on its Representative List of the Intangible Cultural Heritage of Humanity in 2021.': 'UNESCO menyenaraikan tradisi songket Malaysia dalam Senarai Perwakilan Warisan Budaya Tidak Ketara Kemanusiaan pada tahun 2021.',
  '← Back to Home': '← Kembali ke Utama',
  'Last updated: September 2026': 'Kemas kini terakhir: September 2026',
  'Voltraz Studios (“we”, “us”, or “our”) operates Pasar Karat Digital Heritage. This Privacy Policy explains how information may be collected, used, and handled when you use this website.': 'Voltraz Studios (“kami”) mengendalikan Pasar Karat Digital Heritage. Dasar Privasi ini menerangkan bagaimana maklumat boleh dikumpulkan, digunakan dan dikendalikan apabila anda menggunakan laman web ini.',
  '1. Information You Provide': '1. Maklumat Yang Anda Berikan',
  'We may collect information that you voluntarily provide when you contact us or submit information through forms. This may include your name, email address, subject, message, seller or product information, heritage suggestions, and any other information you choose to provide.': 'Kami mungkin mengumpul maklumat yang anda berikan secara sukarela apabila menghubungi kami atau menghantar maklumat melalui borang. Ini mungkin termasuk nama, alamat e-mel, subjek, mesej, maklumat penjual atau produk, cadangan warisan dan maklumat lain yang anda pilih untuk berikan.',
  'Product submissions and Archive suggestions may be collected through external forms such as Google Forms. Information submitted through those services may also be processed according to the privacy policies of the relevant service provider.': 'Penghantaran produk dan cadangan Arkib mungkin dikumpulkan melalui borang luar seperti Google Forms. Maklumat yang dihantar melalui perkhidmatan tersebut juga mungkin diproses mengikut dasar privasi penyedia perkhidmatan berkaitan.',
  '2. Website Data and Local Storage': '2. Data Laman Web dan Storan Tempatan',
  'Some website features may store information locally in your browser, including Saved Items, heritage discovery progress, visitor identifiers used for Archive Likes, and similar preferences.': 'Sesetengah ciri laman web mungkin menyimpan maklumat secara tempatan dalam pelayar anda, termasuk Item Disimpan, kemajuan penemuan warisan, pengecam pelawat yang digunakan untuk Suka Arkib dan pilihan yang serupa.',
  'This information helps these features continue working when you revisit the website using the same browser or device.': 'Maklumat ini membantu ciri-ciri tersebut terus berfungsi apabila anda melawat semula laman web menggunakan pelayar atau peranti yang sama.',
  '3. Archive Likes': '3. Suka Arkib',
  'The Malaysian Digital Archive includes a public Like feature. The website may use a browser-based visitor identifier and server-side records to help maintain Like status and shared Like counts.': 'Arkib Digital Malaysia mempunyai ciri Suka awam. Laman web mungkin menggunakan pengecam pelawat berasaskan pelayar dan rekod pelayan untuk membantu mengekalkan status Suka serta jumlah Suka yang dikongsi.',
  '4. How We Use Information': '4. Cara Kami Menggunakan Maklumat',
  'Information may be used to:': 'Maklumat mungkin digunakan untuk:',
  'Respond to enquiries and messages.': 'Menjawab pertanyaan dan mesej.',
  'Review seller and product submissions.': 'Menyemak penghantaran penjual dan produk.',
  'Review suggestions for the Malaysian Digital Archive.': 'Menyemak cadangan untuk Arkib Digital Malaysia.',
  'Operate website features such as Archive Likes.': 'Mengendalikan ciri laman web seperti Suka Arkib.',
  'Maintain and improve the website and its services.': 'Menyelenggara dan menambah baik laman web serta perkhidmatannya.',
  'Prevent spam, abuse, or technical problems.': 'Mencegah spam, penyalahgunaan atau masalah teknikal.',
  '5. External Websites and Services': '5. Laman Web dan Perkhidmatan Luar',
  'Pasar Karat Digital Heritage may contain links to third-party websites, marketplaces, seller pages, social platforms, Google Forms, and other external services.': 'Pasar Karat Digital Heritage mungkin mengandungi pautan ke laman web pihak ketiga, pasaran, halaman penjual, platform sosial, Google Forms dan perkhidmatan luar lain.',
  'We are not responsible for the privacy practices, content, or operation of third-party websites. Users should review the privacy policies of those services when leaving our website.': 'Kami tidak bertanggungjawab terhadap amalan privasi, kandungan atau operasi laman web pihak ketiga. Pengguna perlu menyemak dasar privasi perkhidmatan tersebut apabila meninggalkan laman web kami.',
  '6. Affiliate Links': '6. Pautan Afiliasi',
  'Some external links may be affiliate links. Pasar Karat Digital Marketplace may receive a commission from qualifying purchases. Purchases and transactions take place on external websites and are subject to the terms and privacy practices of those third parties.': 'Sesetengah pautan luar mungkin merupakan pautan afiliasi. Pasar Karat Digital Marketplace mungkin menerima komisen daripada pembelian yang layak. Pembelian dan transaksi berlaku di laman web luar dan tertakluk pada terma serta amalan privasi pihak ketiga tersebut.',
  '7. Sharing of Information': '7. Perkongsian Maklumat',
  'We do not sell or rent personal information. Information may be processed by service providers that help operate the website, forms, hosting, or related functionality where necessary to provide those services.': 'Kami tidak menjual atau menyewakan maklumat peribadi. Maklumat mungkin diproses oleh penyedia perkhidmatan yang membantu mengendalikan laman web, borang, pengehosan atau fungsi berkaitan apabila perlu untuk menyediakan perkhidmatan tersebut.',
  '8. Data Security': '8. Keselamatan Data',
  'We take reasonable measures to protect information associated with the website. However, no method of electronic storage or transmission over the Internet can be guaranteed to be completely secure.': 'Kami mengambil langkah yang munasabah untuk melindungi maklumat yang berkaitan dengan laman web. Namun, tiada kaedah penyimpanan elektronik atau penghantaran melalui Internet yang boleh dijamin selamat sepenuhnya.',
  '9. Children\'s Privacy': '9. Privasi Kanak-kanak',
  'Pasar Karat Digital Heritage is not intended to knowingly collect unnecessary personal information from children. If you believe personal information has been submitted by a child inappropriately, please contact us.': 'Pasar Karat Digital Heritage tidak bertujuan untuk mengumpul maklumat peribadi kanak-kanak yang tidak perlu secara sengaja. Jika anda percaya maklumat peribadi telah dihantar oleh seorang kanak-kanak secara tidak wajar, sila hubungi kami.',
  '10. Changes to This Privacy Policy': '10. Perubahan kepada Dasar Privasi Ini',
  'We may update this Privacy Policy as the website and its features change. The latest version will be published on this page with an updated revision date.': 'Kami mungkin mengemas kini Dasar Privasi ini apabila laman web dan cirinya berubah. Versi terkini akan diterbitkan pada halaman ini bersama tarikh semakan yang dikemas kini.',
  '11. Contact': '11. Hubungi',
  'For questions about this Privacy Policy, contact:': 'Untuk pertanyaan tentang Dasar Privasi ini, hubungi:',
  'These Terms of Service govern your use of the Pasar Karat Digital Heritage website operated by Voltraz Studios. By using this website, you agree to these Terms.': 'Terma Perkhidmatan ini mengawal penggunaan laman web Pasar Karat Digital Heritage yang dikendalikan oleh Voltraz Studios. Dengan menggunakan laman web ini, anda bersetuju dengan Terma ini.',
  '1. Purpose of the Platform': '1. Tujuan Platform',
  'Pasar Karat Digital Heritage is a digital heritage platform designed to support the exploration, preservation, discovery, and presentation of Malaysian heritage and related products.': 'Pasar Karat Digital Heritage ialah platform warisan digital yang direka untuk menyokong penerokaan, pemeliharaan, penemuan dan penyampaian warisan Malaysia serta produk berkaitan.',
  'The website may include educational Archive content, an interactive virtual experience, links to products or sellers, community submissions, and other related features.': 'Laman web ini mungkin merangkumi kandungan Arkib pendidikan, pengalaman maya interaktif, pautan kepada produk atau penjual, sumbangan komuniti dan ciri berkaitan lain.',
  '2. Educational and Archive Content': '2. Kandungan Pendidikan dan Arkib',
  'Information presented in the Malaysian Digital Archive is provided for general educational and informational purposes.': 'Maklumat yang dipaparkan dalam Arkib Digital Malaysia disediakan untuk tujuan pendidikan dan maklumat umum.',
  'We aim to provide useful and responsible information, but we do not guarantee that every entry is complete, error-free, or exhaustive. Heritage information may be updated as additional research or sources become available.': 'Kami berusaha menyediakan maklumat yang berguna dan bertanggungjawab, tetapi tidak menjamin setiap entri lengkap, bebas ralat atau menyeluruh. Maklumat warisan mungkin dikemas kini apabila penyelidikan atau sumber tambahan tersedia.',
  '3. External Sellers and Purchases': '3. Penjual Luar dan Pembelian',
  'Pasar Karat Digital Heritage does not directly process purchases for products linked through external sellers unless explicitly stated otherwise.': 'Pasar Karat Digital Heritage tidak memproses pembelian secara langsung untuk produk yang dipautkan melalui penjual luar kecuali dinyatakan sebaliknya.',
  'When you select an external seller link, you may leave our website. Any purchase, payment, shipping, refund, warranty, product quality, or dispute is between you and the relevant third-party seller or platform and is subject to their terms.': 'Apabila anda memilih pautan penjual luar, anda mungkin meninggalkan laman web kami. Sebarang pembelian, pembayaran, penghantaran, bayaran balik, waranti, kualiti produk atau pertikaian adalah antara anda dengan penjual atau platform pihak ketiga berkaitan dan tertakluk pada terma mereka.',
  'The presence of a product or external link does not guarantee the availability, quality, authenticity, safety, or suitability of that product.': 'Kehadiran produk atau pautan luar tidak menjamin ketersediaan, kualiti, ketulenan, keselamatan atau kesesuaian produk tersebut.',
  '5. Product Submissions': '5. Penghantaran Produk',
  'Sellers or users may be able to submit products for consideration. Submission does not guarantee that a product will be approved, published, promoted, or remain listed.': 'Penjual atau pengguna mungkin boleh menghantar produk untuk pertimbangan. Penghantaran tidak menjamin bahawa produk akan diluluskan, diterbitkan, dipromosikan atau kekal disenaraikan.',
  'We may review, reject, remove, or request additional information about a submission at our discretion.': 'Kami boleh menyemak, menolak, membuang atau meminta maklumat tambahan tentang sesuatu penghantaran mengikut budi bicara kami.',
  'Anyone submitting product information should ensure that they have the right to provide the submitted information, links, descriptions, and media.': 'Sesiapa yang menghantar maklumat produk perlu memastikan mereka mempunyai hak untuk memberikan maklumat, pautan, penerangan dan media yang dihantar.',
  '6. Archive Suggestions': '6. Cadangan Arkib',
  'Users may suggest objects, traditions, food, places, stories, or other subjects for inclusion in the Malaysian Digital Archive.': 'Pengguna boleh mencadangkan objek, tradisi, makanan, tempat, cerita atau subjek lain untuk dimasukkan ke dalam Arkib Digital Malaysia.',
  'Submission does not guarantee inclusion. Suggestions may be reviewed, researched, edited, rejected, or used as a starting point for further research before publication.': 'Penghantaran tidak menjamin penyertaan. Cadangan mungkin disemak, dikaji, disunting, ditolak atau digunakan sebagai titik permulaan untuk penyelidikan lanjut sebelum penerbitan.',
  '7. Acceptable Use': '7. Penggunaan Yang Dibenarkan',
  'You agree not to misuse the website, attempt to interfere with its operation, submit malicious or unlawful material, impersonate others, intentionally provide harmful links, or use the website in a way that violates applicable law or the rights of others.': 'Anda bersetuju untuk tidak menyalahgunakan laman web, cuba mengganggu operasinya, menghantar bahan berniat jahat atau menyalahi undang-undang, menyamar sebagai orang lain, sengaja memberikan pautan berbahaya atau menggunakan laman web dengan cara yang melanggar undang-undang terpakai atau hak orang lain.',
  '8. Intellectual Property': '8. Harta Intelek',
  'Unless otherwise stated, the Pasar Karat Digital Heritage website, its original branding, design, software, and original content are owned by or licensed to Voltraz Studios.': 'Melainkan dinyatakan sebaliknya, laman web Pasar Karat Digital Heritage, penjenamaan asal, reka bentuk, perisian dan kandungan asalnya dimiliki oleh atau dilesenkan kepada Voltraz Studios.',
  'Third-party names, trademarks, products, images, materials, or other content remain the property of their respective owners where applicable.': 'Nama, tanda dagangan, produk, imej, bahan atau kandungan pihak ketiga kekal menjadi milik pemilik masing-masing jika berkenaan.',
  '9. External Links': '9. Pautan Luar',
  'The website may link to third-party websites and services. We do not control those external services and are not responsible for their availability, content, policies, security, or practices.': 'Laman web mungkin memaut ke laman web dan perkhidmatan pihak ketiga. Kami tidak mengawal perkhidmatan luar tersebut dan tidak bertanggungjawab terhadap ketersediaan, kandungan, dasar, keselamatan atau amalannya.',
  '10. Availability and Changes': '10. Ketersediaan dan Perubahan',
  'We may modify, update, suspend, or discontinue website features or content as the platform develops.': 'Kami mungkin mengubah suai, mengemas kini, menggantung atau menghentikan ciri atau kandungan laman web apabila platform berkembang.',
  'We do not guarantee uninterrupted or error-free availability of the website.': 'Kami tidak menjamin laman web tersedia tanpa gangguan atau bebas ralat.',
  '11. Limitation of Liability': '11. Had Liabiliti',
  'To the extent permitted by applicable law, Voltraz Studios will not be responsible for indirect or consequential losses arising from the use of the website or reliance on third-party websites, products, sellers, or services linked from it.': 'Setakat yang dibenarkan oleh undang-undang terpakai, Voltraz Studios tidak akan bertanggungjawab terhadap kerugian tidak langsung atau berbangkit daripada penggunaan laman web atau pergantungan pada laman web, produk, penjual atau perkhidmatan pihak ketiga yang dipautkan daripadanya.',
  'Nothing in these Terms excludes rights or liabilities that cannot lawfully be excluded.': 'Tiada apa-apa dalam Terma ini mengecualikan hak atau liabiliti yang tidak boleh dikecualikan secara sah.',
  '12. Changes to These Terms': '12. Perubahan kepada Terma Ini',
  'We may update these Terms from time to time. The latest version will be published on this page with the updated revision date.': 'Kami mungkin mengemas kini Terma ini dari semasa ke semasa. Versi terkini akan diterbitkan pada halaman ini bersama tarikh semakan yang dikemas kini.',
  '13. Contact': '13. Hubungi',
  'Questions about these Terms can be sent to:': 'Pertanyaan tentang Terma ini boleh dihantar kepada:',

  'Learn More →': 'Ketahui Lebih Lanjut →',
  'Explore Malaysia’s Living Heritage': 'Terokai Warisan Hidup Malaysia',
  'Explore Malaysia&apos;s Living Heritage': 'Terokai Warisan Hidup Malaysia',
  'Discover the objects, food, traditions, places and stories that form Malaysia’s cultural identity.': 'Temui objek, makanan, tradisi, tempat dan cerita yang membentuk identiti budaya Malaysia.',
  'Discover the objects, food, traditions, places and stories that form Malaysia&apos;s cultural identity.': 'Temui objek, makanan, tradisi, tempat dan cerita yang membentuk identiti budaya Malaysia.',
  'All Archive': 'Semua Arkib',
  'No archive entries found': 'Tiada entri arkib ditemui',
  'Try another search or category. This archive is growing.': 'Cuba carian atau kategori lain. Arkib ini sedang berkembang.',
  'Previous': 'Sebelumnya',
  'Next': 'Seterusnya',

  'COMMUNITY CONTRIBUTION': 'SUMBANGAN KOMUNITI',
  'Community contribution': 'Sumbangan komuniti',
  'Product submissions': 'Penghantaran produk',
  'Help grow the Malaysian Digital Archive by suggesting a heritage object, food, tradition, place, story or other part of Malaysian culture.': 'Bantu mengembangkan Arkib Digital Malaysia dengan mencadangkan objek warisan, makanan, tradisi, tempat, cerita atau bahagian lain daripada budaya Malaysia.',
  'Sell heritage, vintage, craft, collectible or culturally relevant products? Submit your product for review and it may be featured in our collection.': 'Menjual produk warisan, vintaj, kraf, koleksi atau produk berkaitan budaya? Hantar produk anda untuk semakan dan ia mungkin dipaparkan dalam koleksi kami.',
  'Leave this empty': 'Biarkan ruang ini kosong',

  'Malaysia flag': 'Bendera Malaysia',
  'United Kingdom flag': 'Bendera United Kingdom',
  'Switch to Bahasa Melayu': 'Tukar ke Bahasa Melayu',
  'Switch to English': 'Tukar ke Bahasa Inggeris',

  'Search the Archive': 'Cari Arkib',
  'Search the Archive...': 'Cari dalam Arkib...',
  'Clear Archive search': 'Kosongkan carian Arkib',
  'Archive categories': 'Kategori Arkib',
  'Archive pages': 'Halaman Arkib',
  'Footer product navigation': 'Navigasi produk kaki halaman',
  'Footer legal navigation': 'Navigasi perundangan kaki halaman',
  'Experience features': 'Ciri pengalaman',

};

// Marketplace account, seller storefront, moderation and Pro features.
Object.assign(EN_TO_MS, {
  "My Store": "Kedai Saya",
  "Profile": "Profil",
  "Pasar Karat home": "Utama Pasar Karat",
  "Main navigation": "Navigasi utama",

  "MARKETPLACE ACCOUNT": "AKAUN PASARAN",
  "Welcome back.": "Selamat kembali.",
  "Sign in to submit a product and follow its review status.": "Log masuk untuk menghantar produk dan mengikuti status semakannya.",
  "Password updated. Sign in with your new password.": "Kata laluan dikemas kini. Log masuk dengan kata laluan baharu anda.",
  "This confirmation link could not be used. Please sign in or request a new link.": "Pautan pengesahan ini tidak dapat digunakan. Sila log masuk atau minta pautan baharu.",
  "Password": "Kata laluan",
  "Signing in…": "Sedang log masuk…",
  "Sign in": "Log masuk",
  "Forgot password?": "Lupa kata laluan?",
  "New here?": "Baru di sini?",
  "Create account": "Cipta akaun",
  "JOIN THE MARKETPLACE": "SERTAI PASARAN",
  "Create your account.": "Cipta akaun anda.",
  "Use one account to submit products and track moderation.": "Gunakan satu akaun untuk menghantar produk dan menjejaki moderasi.",
  "Display name": "Nama paparan",
  "Confirm password": "Sahkan kata laluan",
  "Creating account…": "Sedang mencipta akaun…",
  "Already have an account?": "Sudah mempunyai akaun?",
  "ACCOUNT RECOVERY": "PEMULIHAN AKAUN",
  "Reset your password.": "Tetapkan semula kata laluan anda.",
  "Enter your email and we'll send a secure reset link.": "Masukkan e-mel anda dan kami akan menghantar pautan tetapan semula yang selamat.",
  "That reset link is invalid or expired. Request a new one.": "Pautan tetapan semula itu tidak sah atau telah tamat tempoh. Minta pautan baharu.",
  "Send reset link": "Hantar pautan tetapan semula",
  "Back to sign in": "Kembali ke log masuk",
  "Choose a new password.": "Pilih kata laluan baharu.",
  "New password": "Kata laluan baharu",
  "Updating…": "Sedang mengemas kini…",
  "Update password": "Kemas kini kata laluan",

  "YOUR ACCOUNT": "AKAUN ANDA",
  "Edit profile": "Edit profil",
  "Update your account details and the identity shown on your shop.": "Kemas kini butiran akaun dan identiti yang dipaparkan di kedai anda.",
  "Marketplace Member": "Ahli Pasaran",
  "Change profile picture": "Tukar gambar profil",
  "Change photo": "Tukar foto",
  "Upload picture": "Muat naik gambar",
  "Remove current picture": "Buang gambar semasa",
  "Username": "Nama pengguna",
  "Shop Description": "Penerangan Kedai",
  "This is the public name shown on your store.": "Ini ialah nama awam yang dipaparkan di kedai anda.",
  "Tell people what you sell or collect.": "Beritahu orang tentang apa yang anda jual atau kumpulkan.",
  "Maximum 300 characters.": "Maksimum 300 aksara.",
  "Name": "Nama",
  "Phone number": "Nombor telefon",
  "Gender": "Jantina",
  "Not selected": "Tidak dipilih",
  "Male": "Lelaki",
  "Female": "Perempuan",
  "Prefer not to say": "Tidak mahu nyatakan",
  "Date of birth": "Tarikh lahir",
  "This is the email used to create your account.": "Ini ialah e-mel yang digunakan untuk mencipta akaun anda.",
  "Name, email, phone number, gender and date of birth stay private. Your public store shows only your username, shop description and profile picture.": "Nama, e-mel, nombor telefon, jantina dan tarikh lahir kekal peribadi. Kedai awam anda hanya memaparkan nama pengguna, penerangan kedai dan gambar profil.",
  "Saving…": "Sedang menyimpan…",
  "Save profile": "Simpan profil",

  "COMMUNITY COLLECTION": "KOLEKSI KOMUNITI",
  "Submit a product": "Hantar produk",
  "Share a find from your shop or collection. We'll review it before it appears publicly.": "Kongsi barangan daripada kedai atau koleksi anda. Kami akan menyemaknya sebelum dipaparkan secara awam.",
  "My submissions": "Penghantaran saya",
  "Product name": "Nama produk",
  "Price (RM)": "Harga (RM)",
  "Category": "Kategori",
  "Choose a category": "Pilih kategori",
  "Description": "Penerangan",
  "Describe the item, condition, story or anything buyers should know.": "Terangkan barangan, keadaan, cerita atau apa-apa yang pembeli perlu tahu.",
  "Plain text only · maximum 2,000 characters": "Teks biasa sahaja · maksimum 2,000 aksara",
  "Product image": "Imej produk",
  "PNG, JPG or WebP · maximum 5 MB. Images are decoded and re-encoded before storage.": "PNG, JPG atau WebP · maksimum 5 MB. Imej dinyahkod dan dikod semula sebelum disimpan.",
  "Where is it available?": "Di mana ia tersedia?",
  "Select at least one platform, then add the product or seller link.": "Pilih sekurang-kurangnya satu platform, kemudian tambah pautan produk atau penjual.",
  "Seller website/product URL": "URL laman web/produk penjual",
  "Affiliate URL": "URL afiliasi",
  "Every submission is reviewed first.": "Setiap penghantaran akan disemak terlebih dahulu.",
  "Your product stays private until an administrator approves it.": "Produk anda kekal peribadi sehingga pentadbir meluluskannya.",
  "Submitting for review…": "Sedang dihantar untuk semakan…",
  "Submit for review": "Hantar untuk semakan",
  "Choose at least one selling platform.": "Pilih sekurang-kurangnya satu platform jualan.",

  "YOUR MARKETPLACE": "PASARAN ANDA",
  "Track what is waiting for review and what has been approved.": "Jejaki perkara yang menunggu semakan dan yang telah diluluskan.",
  "Submit another product": "Hantar produk lain",
  "Sign out": "Log keluar",
  "Product submitted. It is private while an administrator reviews it.": "Produk telah dihantar. Ia kekal peribadi sementara pentadbir menyemaknya.",
  "Image unavailable": "Imej tidak tersedia",
  "Reason:": "Sebab:",
  "View public product": "Lihat produk awam",
  "No submissions yet": "Belum ada penghantaran",
  "Your submitted products will appear here.": "Produk yang anda hantar akan muncul di sini.",

  "Sign in to save your favourite finds": "Log masuk untuk menyimpan penemuan kegemaran anda",
  "Your saved items are linked to your account, so you can access them again on any device.": "Item yang disimpan dipautkan kepada akaun anda supaya anda boleh mengaksesnya semula pada mana-mana peranti.",
  "Sign in to continue": "Log masuk untuk teruskan",

  "Pasar Karat seller": "Penjual Pasar Karat",
  "Seller marketplace links": "Pautan pasaran penjual",
  "View Store": "Lihat Kedai",
  "Customize Store": "Sesuaikan Kedai",
  "My Submission": "Penghantaran Saya",
  "Follow": "Ikut",
  "Following": "Mengikuti",
  "Ratings:": "Penilaian:",
  "Products:": "Produk:",
  "Follower:": "Pengikut:",
  "Joined:": "Sejak:",
  "All Products": "Semua Produk",
  "More from this shop": "Lagi daripada kedai ini",
  "HANDPICKED BY THE SELLER": "PILIHAN PENJUAL",
  "Featured Products": "Produk Pilihan",
  "Search in this shop": "Cari dalam kedai ini",
  "Search In This Shop": "Cari Dalam Kedai Ini",
  "Clear shop search": "Kosongkan carian kedai",
  "Store sections": "Bahagian kedai",
  "Sort and filter store products": "Isih dan tapis produk kedai",
  "Sort by": "Isih mengikut",
  "Popular": "Popular",
  "Latest": "Terkini",
  "Most saved": "Paling banyak disimpan",
  "Sort by price": "Isih mengikut harga",
  "Filter by platform": "Tapis mengikut platform",
  "Price": "Harga",
  "Price: Low To High": "Harga: Rendah ke Tinggi",
  "Price: High To Low": "Harga: Tinggi ke Rendah",
  "Platform": "Platform",
  "Product pages": "Halaman produk",
  "Previous page": "Halaman sebelumnya",
  "Next page": "Halaman seterusnya",
  "No products match these filters.": "Tiada produk sepadan dengan penapis ini.",
  "No products found": "Tiada produk ditemui",
  "Try another search, sort or platform filter.": "Cuba carian, isihan atau penapis platform yang lain.",

  "YOUR STOREFRONT": "KEDAI ANDA",
  "Customize your shop": "Sesuaikan kedai anda",
  "Close customizer": "Tutup penyesuaian",
  "No banner yet": "Belum ada sepanduk",
  "Change banner": "Tukar sepanduk",
  "Upload banner": "Muat naik sepanduk",
  "Remove banner": "Buang sepanduk",
  "PNG, JPG or WebP · maximum 5 MB. Banner is centered automatically.": "PNG, JPG atau WebP · maksimum 5 MB. Sepanduk dipusatkan secara automatik.",
  "Marketplace links": "Pautan pasaran",
  "Add your main seller/store links. Available on Free and Pro.": "Tambah pautan penjual/kedai utama anda. Tersedia untuk Free dan Pro.",
  "Pro storefront": "Kedai Pro",
  "Colours, fonts, featured products and your custom shop URL.": "Warna, fon, produk pilihan dan URL kedai tersuai anda.",
  "Reset to default": "Tetapkan semula ke lalai",
  "PRO ACTIVE": "PRO AKTIF",
  "Upgrade to Pro": "Naik taraf ke Pro",
  "Accent colour": "Warna aksen",
  "Page background": "Latar belakang halaman",
  "Cards / boxes": "Kad / kotak",
  "Store font": "Fon kedai",
  "Pasar Karat Default": "Lalai Pasar Karat",
  "Classic — Georgia": "Klasik — Georgia",
  "Clean — Inter": "Bersih — Inter",
  "Modern — Manrope": "Moden — Manrope",
  "Vintage — Lora": "Vintaj — Lora",
  "Typewriter — Courier": "Mesin Taip — Courier",
  "Store preview": "Pratonton kedai",
  "Your shop identity": "Identiti kedai anda",
  "Text colour changes automatically for readability.": "Warna teks berubah secara automatik supaya mudah dibaca.",
  "Accent button": "Butang aksen",
  "Choose up to four approved products to highlight on Home.": "Pilih sehingga empat produk yang diluluskan untuk ditonjolkan di Utama.",
  "Add an approved product first.": "Tambah produk yang diluluskan terlebih dahulu.",
  "Custom store URL": "URL kedai tersuai",
  "3–40 characters · lowercase letters, numbers and hyphens.": "3–40 aksara · huruf kecil, nombor dan tanda sempang.",
  "Your saved Free storefront stays unchanged. Upgrade only unlocks visual identity and Pro tools.": "Kedai Free anda yang disimpan kekal tanpa perubahan. Naik taraf hanya membuka identiti visual dan alat Pro.",
  "Home and All Products are always included. Add up to 5 custom sections.": "Utama dan Semua Produk sentiasa disertakan. Tambah sehingga 5 bahagian tersuai.",
  "Add section": "Tambah bahagian",
  "Section name": "Nama bahagian",
  "e.g. Vintage Audio": "cth. Audio Vintaj",
  "Sub Category": "Subkategori",
  "Sub Category name": "Nama subkategori",
  "Image": "Imej",
  "Remove content block": "Buang blok kandungan",
  "e.g. Turntables": "cth. Pemain Piring Hitam",
  "You need an approved product before adding products to this Sub Category.": "Anda memerlukan produk yang diluluskan sebelum menambah produk ke Subkategori ini.",
  "Section image preview": "Pratonton imej bahagian",
  "Choose an image": "Pilih imej",
  "Change image": "Tukar imej",
  "PNG, JPG or WebP · maximum 5 MB.": "PNG, JPG atau WebP · maksimum 5 MB.",
  "Add content": "Tambah kandungan",
  "This section has reached the content limit.": "Bahagian ini telah mencapai had kandungan.",
  "No custom sections yet. Your store still has Home and All Products.": "Belum ada bahagian tersuai. Kedai anda masih mempunyai Utama dan Semua Produk.",
  "Saving store…": "Sedang menyimpan kedai…",
  "Save Store": "Simpan Kedai",
  "Your selected products stay checked after saving.": "Produk yang dipilih kekal ditanda selepas disimpan.",
  "Store customization saved.": "Penyesuaian kedai telah disimpan.",
  "Shop banner must be 5 MB or smaller.": "Sepanduk kedai mestilah 5 MB atau lebih kecil.",
  "Section images must be 5 MB or smaller.": "Imej bahagian mestilah 5 MB atau lebih kecil.",
  "Use a PNG, JPG, or WebP image.": "Gunakan imej PNG, JPG atau WebP.",
  "The selected image could not be safely processed.": "Imej yang dipilih tidak dapat diproses dengan selamat.",
  "Store customization is unavailable right now.": "Penyesuaian kedai tidak tersedia buat masa ini.",
  "Your session has expired. Please sign in again.": "Sesi anda telah tamat. Sila log masuk semula.",
  "A store can have at most 5 custom sections.": "Sebuah kedai boleh mempunyai maksimum 5 bahagian tersuai.",
  "Unable to read your store sections. Please try again.": "Bahagian kedai anda tidak dapat dibaca. Sila cuba lagi.",
  "Unable to load your current store.": "Kedai semasa anda tidak dapat dimuatkan.",
  "Unable to read your marketplace links.": "Pautan pasaran anda tidak dapat dibaca.",
  "Unable to upload your shop banner.": "Sepanduk kedai anda tidak dapat dimuat naik.",
  "Section names must be safe and between 2 and 40 characters.": "Nama bahagian mestilah selamat dan antara 2 hingga 40 aksara.",
  "Home and All Products are reserved section names.": "Utama dan Semua Produk ialah nama bahagian yang dikhaskan.",
  "Each custom section needs a different name.": "Setiap bahagian tersuai memerlukan nama yang berbeza.",
  "Each section can contain up to 12 content blocks.": "Setiap bahagian boleh mengandungi sehingga 12 blok kandungan.",
  "Subcategory names must be safe and 60 characters or fewer.": "Nama subkategori mestilah selamat dan tidak melebihi 60 aksara.",
  "Unable to upload one of your section images.": "Salah satu imej bahagian anda tidak dapat dimuat naik.",
  "Choose an image for every image block before saving.": "Pilih imej untuk setiap blok imej sebelum menyimpan.",
  "One of the store content blocks is invalid.": "Salah satu blok kandungan kedai tidak sah.",
  "Unable to save your store customization.": "Penyesuaian kedai anda tidak dapat disimpan.",
  "Unable to save your marketplace links.": "Pautan pasaran anda tidak dapat disimpan.",
  "Choose valid storefront colours.": "Pilih warna kedai yang sah.",
  "Choose a valid store font.": "Pilih fon kedai yang sah.",
  "Custom store URL must use 3–40 lowercase letters, numbers or hyphens.": "URL kedai tersuai mesti menggunakan 3–40 huruf kecil, nombor atau tanda sempang.",
  "Unable to read featured products.": "Produk pilihan tidak dapat dibaca.",
  "Choose up to four featured products.": "Pilih sehingga empat produk pilihan.",
  "Unable to save Pro storefront settings.": "Tetapan kedai Pro tidak dapat disimpan.",

  "PASAR KARAT PRO": "PASAR KARAT PRO",
  "Make your shop feel like your shop.": "Jadikan kedai anda benar-benar milik anda.",
  "Keep the same trusted Pasar Karat layout, then unlock your own colours, fonts, featured products and custom store URL.": "Kekalkan susun atur Pasar Karat yang dipercayai, kemudian buka warna, fon, produk pilihan dan URL kedai tersuai anda.",
  "Pro active": "Pro aktif",
  "Your Billplz payment is being confirmed. Pro will activate when the secure callback arrives.": "Pembayaran Billplz anda sedang disahkan. Pro akan diaktifkan apabila panggilan balik selamat diterima.",
  "Pasar Karat Pro plans": "Pelan Pasar Karat Pro",
  "MONTHLY": "BULANAN",
  "30 days of Pro storefront customization.": "30 hari penyesuaian kedai Pro.",
  "Choose Monthly": "Pilih Bulanan",
  "Sign in to upgrade": "Log masuk untuk naik taraf",
  "BEST VALUE · ANNUAL": "NILAI TERBAIK · TAHUNAN",
  "365 days of Pro and two months effectively free.": "365 hari Pro dengan nilai bersamaan dua bulan percuma.",
  "Choose Annual": "Pilih Tahunan",
  "Accent, background and card colours": "Warna aksen, latar belakang dan kad",
  "Automatic readable text colour": "Warna teks automatik untuk keterbacaan",
  "Classic, Clean, Modern, Vintage and Typewriter fonts": "Fon Klasik, Bersih, Moden, Vintaj dan Mesin Taip",
  "Up to four featured products": "Sehingga empat produk pilihan",
  "Pro seller badge": "Lencana penjual Pro",
  "The storefront features are ready. Billplz checkout stays disabled until the sandbox credentials and public callback URL are added.": "Ciri kedai sudah tersedia. Checkout Billplz kekal dilumpuhkan sehingga kelayakan sandbox dan URL panggilan balik awam ditambahkan.",
  "Billplz sandbox is not configured yet. Add the server keys first.": "Sandbox Billplz belum dikonfigurasi. Tambah kekunci pelayan terlebih dahulu.",
  "Your account needs an email address before Billplz checkout can start.": "Akaun anda memerlukan alamat e-mel sebelum checkout Billplz boleh dimulakan.",
  "Billplz created the checkout step, but Pasar Karat could not register the payment in Supabase.": "Billplz telah mencipta langkah checkout, tetapi Pasar Karat tidak dapat mendaftarkan pembayaran dalam Supabase.",
  "Billplz rejected the Sandbox Secret Key. Check that the new Sandbox key is saved in Netlify.": "Billplz menolak Sandbox Secret Key. Pastikan kekunci Sandbox baharu disimpan dalam Netlify.",
  "Billplz rejected the bill details. Check that the Collection ID is from Collection (not Payment Form/Open Collection) and belongs to the same Sandbox account as the Secret Key.": "Billplz menolak butiran bil. Pastikan Collection ID datang daripada Collection (bukan Payment Form/Open Collection) dan menggunakan akaun Sandbox yang sama dengan Secret Key.",
  "Billplz Sandbox is temporarily unavailable. Try again shortly.": "Billplz Sandbox tidak tersedia buat sementara waktu. Cuba lagi sebentar lagi.",
  "Billplz rate-limited the request. Wait a moment and try again.": "Billplz mengehadkan kadar permintaan. Tunggu sebentar dan cuba lagi.",
  "Unable to start the payment. Please try again.": "Pembayaran tidak dapat dimulakan. Sila cuba lagi.",
  "Payment received.": "Pembayaran diterima.",
  "Billplz is confirming the payment securely with Pasar Karat. Your Pro access activates from the server callback, not from this browser page.": "Billplz sedang mengesahkan pembayaran dengan selamat bersama Pasar Karat. Akses Pro anda diaktifkan melalui panggilan balik pelayan, bukan daripada halaman pelayar ini.",
  "Check Pro status": "Semak status Pro",

  "PRIVATE MODERATION": "MODERASI PERIBADI",
  "Product submissions": "Penghantaran produk",
  "Review new products and manage community products already published in the Collection.": "Semak produk baharu dan urus produk komuniti yang telah diterbitkan dalam Koleksi.",
  "WAITING FOR REVIEW": "MENUNGGU SEMAKAN",
  "Pending submissions": "Penghantaran menunggu",
  "Submitter": "Penghantar",
  "Marketplace member": "Ahli pasaran",
  "Seller links": "Pautan penjual",
  "Affiliate:": "Afiliasi:",
  "Rejection reason": "Sebab penolakan",
  "Required only when rejecting": "Diperlukan hanya apabila menolak",
  "Approve": "Luluskan",
  "Reject": "Tolak",
  "Nothing waiting for review": "Tiada yang menunggu semakan",
  "New product submissions will appear here.": "Penghantaran produk baharu akan muncul di sini.",
  "LIVE IN COLLECTION": "AKTIF DALAM KOLEKSI",
  "Published community products": "Produk komuniti yang diterbitkan",
  "View product": "Lihat produk",
  "No community products published yet": "Belum ada produk komuniti diterbitkan",
  "Approved submissions will appear here for admin management.": "Penghantaran yang diluluskan akan muncul di sini untuk pengurusan admin.",
  "Only community-submitted products appear here. The original built-in Pasar Karat catalogue is protected.": "Hanya produk yang dihantar oleh komuniti muncul di sini. Katalog asal Pasar Karat dilindungi.",
  "pending": "menunggu",
  "approved": "diluluskan",
  "rejected": "ditolak"
});

Object.assign(EN_TO_MS, {
  "Products": "Produk",
  "Seller Website": "Laman Web Penjual",
  "Own website": "Laman web sendiri",
  "Choose image": "Pilih imej",
  "Custom /shop/ store URL": "URL kedai /shop/ tersuai",
  "e.g. Vintage enamel tray": "cth. Dulang enamel vintaj",
  "Pasar Karat Supabase is not configured yet. Follow SUPABASE-SETUP.md first.": "Supabase Pasar Karat belum dikonfigurasi. Ikuti SUPABASE-SETUP.md terlebih dahulu.",

  "Pasar Karat authentication is not configured yet.": "Pengesahan Pasar Karat belum dikonfigurasi.",
  "Enter your email and a password of at least 8 characters.": "Masukkan e-mel anda dan kata laluan sekurang-kurangnya 8 aksara.",
  "Unable to sign in. Check your email and password.": "Tidak dapat log masuk. Semak e-mel dan kata laluan anda.",
  "Use a safe display name between 2 and 60 characters.": "Gunakan nama paparan yang selamat antara 2 hingga 60 aksara.",
  "Your passwords do not match.": "Kata laluan anda tidak sepadan.",
  "Unable to create this account. Try again later.": "Akaun ini tidak dapat dicipta. Cuba lagi kemudian.",
  "Check your email to confirm your account, then return here to sign in.": "Semak e-mel anda untuk mengesahkan akaun, kemudian kembali ke sini untuk log masuk.",
  "Enter your email address.": "Masukkan alamat e-mel anda.",
  "Unable to send a reset email right now.": "E-mel tetapan semula tidak dapat dihantar buat masa ini.",
  "If an account exists for this email, a password reset link has been sent.": "Jika akaun wujud untuk e-mel ini, pautan tetapan semula kata laluan telah dihantar.",
  "Use a password of at least 8 characters.": "Gunakan kata laluan sekurang-kurangnya 8 aksara.",
  "This password reset link is no longer valid.": "Pautan tetapan semula kata laluan ini tidak lagi sah.",
  "Unable to update your password.": "Kata laluan anda tidak dapat dikemas kini.",

  "Profile picture must be 2 MB or smaller.": "Gambar profil mestilah 2 MB atau lebih kecil.",
  "Profile editing is not configured yet.": "Pengeditan profil belum dikonfigurasi.",
  "Use a safe username between 2 and 60 characters.": "Gunakan nama pengguna yang selamat antara 2 hingga 60 aksara.",
  "Use a safe shop description of up to 300 characters.": "Gunakan penerangan kedai yang selamat sehingga 300 aksara.",
  "Name must be 100 characters or fewer.": "Nama mestilah 100 aksara atau kurang.",
  "Enter a valid phone number or leave it blank.": "Masukkan nombor telefon yang sah atau biarkan kosong.",
  "Choose a valid gender option.": "Pilih pilihan jantina yang sah.",
  "Enter a valid date of birth.": "Masukkan tarikh lahir yang sah.",
  "Unable to load your current profile.": "Profil semasa anda tidak dapat dimuatkan.",
  "Unable to upload your profile picture.": "Gambar profil anda tidak dapat dimuat naik.",
  "Unable to save your profile right now.": "Profil anda tidak dapat disimpan buat masa ini.",
  "Profile saved.": "Profil telah disimpan.",

  "Product submissions are not configured yet.": "Penghantaran produk belum dikonfigurasi.",
  "Product name must be between 2 and 100 characters.": "Nama produk mestilah antara 2 hingga 100 aksara.",
  "Description must be between 10 and 2,000 characters.": "Penerangan mestilah antara 10 hingga 2,000 aksara.",
  "Please remove unsafe markup or harmful technical content before submitting.": "Sila buang markup tidak selamat atau kandungan teknikal berbahaya sebelum menghantar.",
  "Choose a valid category.": "Pilih kategori yang sah.",
  "Enter a valid price with up to two decimal places.": "Masukkan harga yang sah dengan sehingga dua tempat perpuluhan.",
  "Enter a valid product price.": "Masukkan harga produk yang sah.",
  "Choose a product image.": "Pilih imej produk.",
  "Product image must be 5 MB or smaller.": "Imej produk mestilah 5 MB atau lebih kecil.",
  "Use a PNG, JPG, JPEG or WebP image.": "Gunakan imej PNG, JPG, JPEG atau WebP.",
  "The uploaded file is not a supported image.": "Fail yang dimuat naik bukan imej yang disokong.",
  "The image file type does not match its contents.": "Jenis fail imej tidak sepadan dengan kandungannya.",
  "The image extension does not match its contents.": "Sambungan imej tidak sepadan dengan kandungannya.",
  "The image could not be safely decoded. Please choose another PNG, JPG or WebP image.": "Imej tidak dapat dinyahkod dengan selamat. Sila pilih imej PNG, JPG atau WebP yang lain.",
  "Unable to upload the product image.": "Imej produk tidak dapat dimuat naik.",
  "Unable to submit this product. Please check the details and try again.": "Produk ini tidak dapat dihantar. Semak butiran dan cuba lagi."
});

Object.assign(EN_TO_MS, {
  "Sell something unique?": "Ada barangan unik untuk dijual?",
  "Submit it for review.": "Hantar untuk semakan.",
  "Submit Product": "Hantar Produk",
  "Compare Seller Price": "Bandingkan Harga Penjual"
});

const MS_TO_EN = Object.fromEntries(Object.entries(EN_TO_MS).map(([en, ms]) => [ms, en]));

function translateDynamic(value: string, language: SiteLanguage) {
  if (language === 'ms') {
    let match = value.match(/^Seller: (.+)$/); if (match) return `Penjual: ${match[1]}`;
    match = value.match(/^View (.+) store$/); if (match) return `Lihat kedai ${match[1]}`;
    match = value.match(/^Remove section (\d+)$/); if (match) return `Buang bahagian ${match[1]}`;
    match = value.match(/^(\d+) pending$/i); if (match) return `${match[1]} menunggu`;
    match = value.match(/^(\d+) published$/i); if (match) return `${match[1]} diterbitkan`;
    match = value.match(/^Until (.+)$/); if (match) return `Sehingga ${match[1]}`;
    match = value.match(/^Enter a valid HTTPS (.+) URL or leave it blank\.$/); if (match) return `Masukkan URL HTTPS ${match[1]} yang sah atau biarkan kosong.`;
    match = value.match(/^(.+) seller\/product URL$/); if (match) return `URL penjual\/produk ${match[1]}`;
    match = value.match(/^Product (approved|rejected|deleted)\.$/i);
    if (match) {
      const state = match[1].toLowerCase()==='approved'?'diluluskan':match[1].toLowerCase()==='rejected'?'ditolak':'dipadam';
      return `Produk ${state}.`;
    }
    match = value.match(/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/);
    if (match) {
      const months:Record<string,string>={Jan:'Jan',Feb:'Feb',Mar:'Mac',Apr:'Apr',May:'Mei',Jun:'Jun',Jul:'Jul',Aug:'Ogo',Sep:'Sep',Oct:'Okt',Nov:'Nov',Dec:'Dis'};
      return `${match[1]} ${months[match[2]]} ${match[3]}`;
    }
    match = value.match(/^(\d+)\s+items?$/i); if (match) return `${match[1]} item`;
    match = value.match(/^(\d+)\s+saved\s+(?:find|finds)$/i); if (match) return `${match[1]} penemuan disimpan`;
    match = value.match(/^(\d+)\s*\/\s*(\d+)\s+Discovered$/); if (match) return `${match[1]} / ${match[2]} Ditemui`;
    match = value.match(/^Page (\d+) of (\d+)$/i); if (match) return `Halaman ${match[1]} daripada ${match[2]}`;
    match = value.match(/^(\d+)\s+items? in (.+)$/i); if (match) return `${match[1]} item dalam ${EN_TO_MS[match[2]] ?? match[2]}`;
  } else {
    let match = value.match(/^(\d+)\s+penemuan disimpan$/i); if (match) return `${match[1]} saved ${match[1] === '1' ? 'find' : 'finds'}`;
    match = value.match(/^(\d+)\s*\/\s*(\d+)\s+Ditemui$/); if (match) return `${match[1]} / ${match[2]} Discovered`;
    match = value.match(/^Halaman (\d+) daripada (\d+)$/i); if (match) return `Page ${match[1]} of ${match[2]}`;
  }
  return value;
}

const EN_PHRASES = Object.keys(EN_TO_MS).sort((a, b) => b.length - a.length);
const MS_PHRASES = Object.keys(MS_TO_EN).sort((a, b) => b.length - a.length);

function replaceKnownPhrases(value: string, language: SiteLanguage) {
  const phrases = language === 'ms' ? EN_PHRASES : MS_PHRASES;
  const dictionary = language === 'ms' ? EN_TO_MS : MS_TO_EN;
  let result = value;
  for (const phrase of phrases) {
    if (phrase.length < 3 || !result.includes(phrase)) continue;
    result = result.split(phrase).join(dictionary[phrase]);
  }
  return result;
}

function translateExact(value: string, language: SiteLanguage) {
  const dynamic = translateDynamic(value, language);
  if (dynamic !== value) return dynamic;
  const direct = language === 'ms' ? EN_TO_MS[value] : MS_TO_EN[value];
  if (direct) return direct;
  return replaceKnownPhrases(value, language);
}

type TextState = { source: string; last: string };
type AttributeState = { source: string; last: string };
const textStates = new WeakMap<Text, TextState>();
const attributeStates = new WeakMap<Element, Map<string, AttributeState>>();

function translateTextNode(node: Text, language: SiteLanguage) {
  const raw = node.nodeValue ?? '';
  if (!raw.trim()) return;
  let state = textStates.get(node);
  if (!state) {
    state = { source: raw, last: raw };
    textStates.set(node, state);
  } else if (raw !== state.last) {
    // React or another component supplied fresh official copy. Treat that as the new English source.
    state.source = raw;
    state.last = raw;
  }
  const sourceTrimmed = state.source.trim();
  const start = state.source.match(/^\s*/)?.[0] ?? '';
  const end = state.source.match(/\s*$/)?.[0] ?? '';
  const translated = language === 'ms' ? translateExact(sourceTrimmed, 'ms') : sourceTrimmed;
  const next = `${start}${translated}${end}`;
  if (node.nodeValue !== next) node.nodeValue = next;
  state.last = next;
}

function shouldSkip(element: Element | null) {
  if (!element) return false;
  return Boolean(element.closest('[data-no-translate],script,style,noscript,code,pre'));
}

function translateAttribute(element: Element, attribute: string, language: SiteLanguage) {
  const raw = element.getAttribute(attribute);
  if (!raw) return;
  let states = attributeStates.get(element);
  if (!states) { states = new Map(); attributeStates.set(element, states); }
  let state = states.get(attribute);
  if (!state) {
    state = { source: raw, last: raw };
    states.set(attribute, state);
  } else if (raw !== state.last) {
    state.source = raw;
    state.last = raw;
  }
  const next = language === 'ms' ? translateExact(state.source, 'ms') : state.source;
  if (raw !== next) element.setAttribute(attribute, next);
  state.last = next;
}

function translateElement(root: ParentNode, language: SiteLanguage) {
  const doc = root instanceof Document ? root : root.ownerDocument;
  if (!doc) return;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();
  while (node) {
    const textNode = node as Text;
    if (!shouldSkip(textNode.parentElement)) translateTextNode(textNode, language);
    node = walker.nextNode();
  }
  const elements = root instanceof Element ? [root, ...Array.from(root.querySelectorAll('*'))] : Array.from(root.querySelectorAll('*'));
  for (const element of elements) {
    if (shouldSkip(element)) continue;
    for (const attribute of ['placeholder', 'aria-label', 'title']) translateAttribute(element, attribute, language);
  }
}

type LanguageContextValue = { language: SiteLanguage; toggleLanguage: () => void };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<SiteLanguage>('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ms') setLanguage('ms');
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'ms' ? 'ms' : 'en';
    localStorage.setItem(STORAGE_KEY, language);
    translateElement(document, language);
    let queued = false;
    const observer = new MutationObserver(records => {
      if (queued) return;
      if (!records.some(record => record.type === 'childList' || record.type === 'characterData')) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        translateElement(document, language);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  const toggleLanguage = useCallback(() => setLanguage(current => current === 'en' ? 'ms' : 'en'), []);
  const value = useMemo(() => ({ language, toggleLanguage }), [language, toggleLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('LanguageProvider is required');
  return value;
}
