export const archiveCategories = ['Traditional Food','Kuih-Muih','Traditional Clothing & Textiles','Traditional Games','Traditional Music & Instruments','Arts & Crafts','Heritage Objects','Architecture & Landmarks','Places & Communities','Nature & Wildlife','Festivals & Traditions','Local Brands & Products','Transport & Mobility','Stories & Folklore','Other'] as const;
export type ArchiveEntry={
 id:string;slug:string;name:string;category:typeof archiveCategories[number];image:string;shortDescription:string;
 overview?:string;origin?:string;culturalSignificance?:string;characteristics?:string[];facts?:string[];
 sources?:{label:string;url:string}[];
 // Optional future relationships. These do not unlock discoveries or add commerce UI.
 relatedHeritageIds?:string[];relatedProductIds?:string[];relatedArchiveIds?:string[];
};
// Introductory sample content. Expand with reviewed stories and sources as the archive grows.
export const archiveEntries:ArchiveEntry[]=[
 {id:'labu-sayong',slug:'labu-sayong',name:'Labu Sayong',category:'Arts & Crafts',image:'/images/archive/labu-sayong.jpg',shortDescription:'Gourd-shaped pottery associated with Sayong, Perak.',overview:'Labu Sayong introduces the relationship between craft and everyday objects. Its rounded body and narrow neck give this pottery a distinctive silhouette.',origin:'Sayong, Perak, Malaysia.',culturalSignificance:'An invitation to explore local pottery traditions and the skills behind familiar household objects.',characteristics:['Gourd-shaped body','Narrow neck','Pottery form'],relatedHeritageIds:['labu-sayong'],relatedProductIds:['7'],relatedArchiveIds:['lesung-batu']},
 {id:'congkak',slug:'congkak',name:'Congkak',category:'Traditional Games',image:'/images/archive/congkak.jpg',shortDescription:'A traditional board game built around counting and thoughtful moves.',overview:'A congkak board uses rows of hollows and small playing pieces. Exploring the board offers a starting point for learning about a shared game and the decisions made with each turn.',culturalSignificance:'Games offer a way to spend time together and pass familiar pastimes between generations.',characteristics:['Rows of playing hollows','Small pieces moved around a board'],relatedHeritageIds:['congkak'],relatedProductIds:['4']},
 {id:'lesung-batu',slug:'lesung-batu',name:'Lesung Batu',category:'Heritage Objects',image:'/images/archive/lesung-batu.jpg',shortDescription:'A stone mortar and pestle used to grind and pound ingredients.',overview:'Lesung Batu brings attention to the practical tools of everyday cooking. A bowl-shaped mortar holds ingredients while a pestle is used to crush or grind them.',culturalSignificance:'Kitchen tools connect everyday routines with the preparation of familiar food.',characteristics:['Stone mortar','Handheld pestle'],facts:['The mortar and pestle are used together.'],relatedHeritageIds:['lesung-batu'],relatedArchiveIds:['labu-sayong','radio-lama']},
 {id:'radio-lama',slug:'radio-lama',name:'Radio Lama',category:'Heritage Objects',image:'/images/archive/radio-lama.jpg',shortDescription:'An old radio and a window into the experience of analogue listening.',overview:'Look closely at the tuning dial, speaker and controls of an old radio. These details offer a way to think about how people listened to music, news and conversation.',culturalSignificance:'An everyday object can carry personal memories of listening at home and sharing favourite programmes.',characteristics:['Tuning controls','Speaker enclosure'],relatedHeritageIds:['radio-lama'],relatedProductIds:['1'],relatedArchiveIds:['lesung-batu']},
 {id:'songket',slug:'songket',name:'Songket',category:'Traditional Clothing & Textiles',image:'/images/archive/songket.jpg',shortDescription:'Handwoven fabric distinguished by decorative supplementary threads.',overview:'Songket uses extra decorative threads woven into a base fabric to create patterned surfaces. Gold- or silver-coloured threads are characteristic of the technique.',culturalSignificance:'Songket is worn for ceremonial and festive occasions, including weddings. Weaving knowledge is passed between generations.',characteristics:['Handwoven textile','Decorative supplementary threads','Geometric and nature-inspired patterns'],facts:['UNESCO inscribed Malaysia’s songket tradition on its Representative List of the Intangible Cultural Heritage of Humanity in 2021.'],sources:[{label:'UNESCO — Songket',url:'https://ich.unesco.org/en/RL/songket-01505'}]},

 // ============================================================
  // TRADITIONAL FOOD — 7
  // ============================================================

  {
    id:'nasi-lemak',
    slug:'nasi-lemak',
    name:'Nasi Lemak',
    category:'Traditional Food',
    image:'/images/archive/nasi-lemak.jpg',
    shortDescription:'Rice cooked with coconut milk and pandan, commonly served with sambal and side dishes.',
    overview:'Nasi lemak is built around fragrant coconut rice. Common accompaniments include sambal, cucumber, roasted peanuts, anchovies and egg, although combinations vary widely.',
    origin:'Malaysia.',
    culturalSignificance:'A familiar Malaysian meal eaten at different times of day and adapted by communities, stalls and households across the country.',
    characteristics:['Coconut rice','Sambal','Often served with several accompaniments']
  },

  {
    id:'rendang-tok',
    slug:'rendang-tok',
    name:'Rendang Tok',
    category:'Traditional Food',
    image:'/images/archive/rendang-tok.jpg',
    shortDescription:'A dark, richly spiced dry rendang associated with Perak.',
    overview:'Rendang Tok is prepared by slowly cooking meat with spices, coconut milk and other aromatics until the mixture becomes dark and concentrated.',
    origin:'Perak, Malaysia.',
    culturalSignificance:'The dish is strongly associated with traditional cooking in Perak and is often prepared for gatherings and festive occasions.',
    characteristics:['Slow-cooked meat','Rich spice mixture','Dry and concentrated texture']
  },

  {
    id:'nasi-kerabu',
    slug:'nasi-kerabu',
    name:'Nasi Kerabu',
    category:'Traditional Food',
    image:'/images/archive/nasi-kerabu.jpg',
    shortDescription:'Herb-filled rice dish especially associated with Kelantan.',
    overview:'Nasi kerabu combines rice with fresh herbs, vegetables, condiments and side dishes. Blue-coloured rice made using butterfly-pea flowers is a well-known variation.',
    origin:'Especially associated with Kelantan, Malaysia.',
    culturalSignificance:'The dish reflects the use of fresh herbs, vegetables and strongly flavoured condiments in East Coast Malaysian cooking.',
    characteristics:['Rice','Fresh herbs','Vegetable garnishes','Multiple condiments']
  },

  {
    id:'nasi-dagang',
    slug:'nasi-dagang',
    name:'Nasi Dagang',
    category:'Traditional Food',
    image:'/images/archive/nasi-dagang.jpg',
    shortDescription:'A rice dish commonly paired with fish curry on Malaysia’s east coast.',
    overview:'Nasi dagang uses rice prepared with coconut milk and is traditionally served with a richly seasoned fish curry and accompaniments.',
    origin:'Terengganu and Kelantan, Malaysia.',
    culturalSignificance:'It is closely associated with breakfast and traditional food culture along the east coast of Peninsular Malaysia.',
    characteristics:['Coconut-flavoured rice','Fish curry','East Coast speciality']
  },

  {
    id:'asam-pedas',
    slug:'asam-pedas',
    name:'Asam Pedas',
    category:'Traditional Food',
    image:'/images/archive/asam-pedas.jpg',
    shortDescription:'A spicy and sour dish commonly prepared with fish.',
    overview:'Asam pedas combines chilli with souring ingredients to create a strongly flavoured gravy. Fish is one of its most familiar main ingredients.',
    origin:'Widely associated with Melaka and southern Peninsular Malaysia.',
    culturalSignificance:'Its combination of sourness, spice and seafood reflects flavours strongly associated with communities in parts of southern Malaysia.',
    characteristics:['Spicy gravy','Sour flavour','Often prepared with fish']
  },

  {
    id:'manok-pansoh',
    slug:'manok-pansoh',
    name:'Manok Pansoh',
    category:'Traditional Food',
    image:'/images/archive/manok-pansoh.jpg',
    shortDescription:'Chicken traditionally cooked inside bamboo in Sarawak.',
    overview:'Manok pansoh is prepared by placing chicken and seasonings inside a bamboo section before cooking it over heat.',
    origin:'Sarawak, Malaysia; associated particularly with Iban and Bidayuh communities.',
    culturalSignificance:'The cooking technique connects food preparation with locally available materials and is associated with celebrations and community meals.',
    characteristics:['Cooked in bamboo','Chicken-based dish','Aromatic seasonings']
  },

  {
    id:'hinava',
    slug:'hinava',
    name:'Hinava',
    category:'Traditional Food',
    image:'/images/archive/hinava.jpg',
    shortDescription:'A fresh fish dish associated with Kadazandusun food traditions in Sabah.',
    overview:'Hinava typically combines fresh fish with citrus juice and ingredients such as ginger, chilli and shallots. Recipes vary between households.',
    origin:'Sabah, Malaysia.',
    culturalSignificance:'Hinava is widely associated with Kadazandusun cuisine and represents Sabah’s diverse indigenous food traditions.',
    characteristics:['Fresh fish','Citrus flavour','Ginger and chilli']
  },


  // ============================================================
  // KUIH-MUIH — 7
  // ============================================================

  {
    id:'kuih-lapis',
    slug:'kuih-lapis',
    name:'Kuih Lapis',
    category:'Kuih-Muih',
    image:'/images/archive/kuih-lapis.jpg',
    shortDescription:'A colourful steamed kuih formed from soft layers.',
    overview:'Kuih lapis is steamed one layer at a time, producing distinctive stripes that can be peeled apart when eaten.',
    origin:'Common throughout Malaysia and the wider Southeast Asian region.',
    culturalSignificance:'Its colourful layered appearance makes it a familiar kuih at markets, gatherings and family tables.',
    characteristics:['Steamed','Layered appearance','Soft texture']
  },

  {
    id:'seri-muka',
    slug:'seri-muka',
    name:'Seri Muka',
    category:'Kuih-Muih',
    image:'/images/archive/seri-muka.jpg',
    shortDescription:'A two-layer kuih combining glutinous rice with pandan custard.',
    overview:'Seri muka usually has a lower layer of coconut-flavoured glutinous rice topped by a smooth green pandan custard.',
    origin:'Malay and Peranakan food traditions in Malaysia and the wider region.',
    culturalSignificance:'Its contrasting layers show how rice, coconut and pandan are combined in traditional kuih making.',
    characteristics:['Glutinous rice base','Pandan custard','Two distinct layers']
  },

  {
    id:'kuih-ketayap',
    slug:'kuih-ketayap',
    name:'Kuih Ketayap',
    category:'Kuih-Muih',
    image:'/images/archive/kuih-ketayap.jpg',
    shortDescription:'A pandan crepe rolled around sweet coconut filling.',
    overview:'Kuih ketayap consists of a thin pandan-flavoured crepe wrapped around grated coconut cooked with palm sugar.',
    origin:'Common in Malaysia.',
    culturalSignificance:'The kuih highlights familiar ingredients such as pandan, coconut and palm sugar.',
    characteristics:['Rolled crepe','Sweet coconut filling','Pandan aroma']
  },

  {
    id:'kuih-bahulu',
    slug:'kuih-bahulu',
    name:'Kuih Bahulu',
    category:'Kuih-Muih',
    image:'/images/archive/kuih-bahulu.jpg',
    shortDescription:'Small traditional sponge cakes baked in decorative moulds.',
    overview:'Bahulu is made from a simple batter commonly containing eggs, sugar and flour and baked in moulds that give each cake its shape.',
    origin:'Long established in Malaysian and wider Malay food traditions.',
    culturalSignificance:'Bahulu is frequently associated with festive visits, family gatherings and home baking.',
    characteristics:['Small sponge cake','Decorative mould','Light texture']
  },

  {
    id:'kuih-keria',
    slug:'kuih-keria',
    name:'Kuih Keria',
    category:'Kuih-Muih',
    image:'/images/archive/kuih-keria.jpg',
    shortDescription:'Sweet potato doughnuts coated with a layer of sugar.',
    overview:'Kuih keria is shaped into rings using sweet potato dough before frying and coating the surface with crystallised sugar.',
    origin:'Malaysia.',
    culturalSignificance:'It is a familiar traditional snack found at markets, stalls and homes.',
    characteristics:['Sweet potato dough','Ring shape','Sugar coating']
  },

  {
    id:'akok',
    slug:'akok',
    name:'Akok',
    category:'Kuih-Muih',
    image:'/images/archive/akok.jpg',
    shortDescription:'A soft sweet kuih strongly associated with Kelantan and Terengganu.',
    overview:'Akok is traditionally made using ingredients such as eggs, coconut milk and sugar. Baking gives it an irregular browned exterior and soft interior.',
    origin:'Kelantan and Terengganu, Malaysia.',
    culturalSignificance:'Akok is closely associated with East Coast kuih traditions and local food markets.',
    characteristics:['Soft interior','Egg-based batter','Caramelised exterior']
  },

  {
    id:'kuih-kapit',
    slug:'kuih-kapit',
    name:'Kuih Kapit',
    category:'Kuih-Muih',
    image:'/images/archive/kuih-kapit.jpg',
    shortDescription:'A thin, crisp folded wafer commonly prepared for festive celebrations.',
    overview:'Kuih kapit is cooked between patterned metal moulds and folded while still hot, creating a delicate and crisp wafer.',
    origin:'Chinese Malaysian and Peranakan communities in Malaysia.',
    culturalSignificance:'It is particularly familiar during Chinese New Year and is often prepared and shared among families.',
    characteristics:['Thin wafer','Crisp texture','Patterned surface']
  },


  // ============================================================
  // TRADITIONAL CLOTHING & TEXTILES — 7
  // ============================================================

  {
    id:'baju-kurung',
    slug:'baju-kurung',
    name:'Baju Kurung',
    category:'Traditional Clothing & Textiles',
    image:'/images/archive/baju-kurung.jpg',
    shortDescription:'A traditional Malay outfit consisting of a long tunic worn with a skirt.',
    overview:'Baju kurung generally combines a loose long-sleeved tunic with a long skirt. Styles and construction vary by region and period.',
    origin:'Malay communities in Malaysia and the wider Malay world.',
    culturalSignificance:'It remains widely worn for formal occasions, celebrations, religious events and everyday dress.',
    characteristics:['Long tunic','Long skirt','Loose silhouette']
  },

  {
    id:'baju-melayu',
    slug:'baju-melayu',
    name:'Baju Melayu',
    category:'Traditional Clothing & Textiles',
    image:'/images/archive/baju-melayu.jpg',
    shortDescription:'Traditional Malay menswear commonly paired with trousers and samping.',
    overview:'Baju Melayu consists of a long-sleeved shirt and trousers and is frequently completed with a samping worn around the waist.',
    origin:'Malay communities in Malaysia and the wider Malay world.',
    culturalSignificance:'It is strongly associated with formal occasions, Hari Raya celebrations and traditional ceremonies.',
    characteristics:['Long-sleeved shirt','Trousers','Often worn with samping']
  },

  {
    id:'kebaya',
    slug:'kebaya',
    name:'Kebaya',
    category:'Traditional Clothing & Textiles',
    image:'/images/archive/kebaya.jpg',
    shortDescription:'A fitted upper garment with many regional and community variations.',
    overview:'The kebaya appears in several styles across Southeast Asia. Malaysian variations include forms associated with Malay and Peranakan communities.',
    origin:'Shared heritage across parts of Southeast Asia, including Malaysia.',
    culturalSignificance:'Different kebaya styles reflect regional identities, textile choices and changing approaches to traditional dress.',
    characteristics:['Fitted upper garment','Often paired with a long skirt or sarong','Multiple regional styles']
  },

  {
    id:'malaysian-batik',
    slug:'malaysian-batik',
    name:'Malaysian Batik',
    category:'Traditional Clothing & Textiles',
    image:'/images/archive/malaysian-batik.jpg',
    shortDescription:'Decorated textile produced using wax-resist and related batik techniques.',
    overview:'Malaysian batik commonly features floral, geometric and nature-inspired designs applied to fabric through techniques including hand drawing and block printing.',
    origin:'Malaysia within the wider Southeast Asian batik tradition.',
    culturalSignificance:'Batik has developed into an important Malaysian textile tradition used in clothing, craft and contemporary design.',
    characteristics:['Patterned textile','Wax-resist technique','Floral and geometric motifs']
  },

  {
    id:'pua-kumbu',
    slug:'pua-kumbu',
    name:'Pua Kumbu',
    category:'Traditional Clothing & Textiles',
    image:'/images/archive/pua-kumbu.jpg',
    shortDescription:'A patterned woven textile strongly associated with Iban communities.',
    overview:'Pua kumbu is created through an intricate weaving process in which carefully prepared threads form complex motifs and patterned surfaces.',
    origin:'Iban communities of Sarawak, Malaysia.',
    culturalSignificance:'The textile carries artistic, social and ceremonial importance within Iban cultural traditions.',
    characteristics:['Handwoven textile','Complex motifs','Carefully prepared dyed threads']
  },

  {
    id:'tenun-pahang-diraja',
    slug:'tenun-pahang-diraja',
    name:'Tenun Pahang Diraja',
    category:'Traditional Clothing & Textiles',
    image:'/images/archive/tenun-pahang-diraja.jpg',
    shortDescription:'A traditional woven textile associated with Pahang.',
    overview:'Tenun Pahang Diraja is characterised by carefully woven cloth and patterned arrangements created through combinations of coloured threads.',
    origin:'Pahang, Malaysia.',
    culturalSignificance:'The textile is associated with Pahang’s weaving heritage and the continuation of skilled handloom traditions.',
    characteristics:['Handwoven','Geometric arrangements','Pahang textile tradition']
  },

  {
    id:'kain-limar',
    slug:'kain-limar',
    name:'Kain Limar',
    category:'Traditional Clothing & Textiles',
    image:'/images/archive/kain-limar.jpg',
    shortDescription:'A decorative woven textile recognised for patterned colour effects.',
    overview:'Limar textiles use carefully prepared coloured threads to form blurred or patterned designs across the finished cloth.',
    origin:'Malay textile traditions in Peninsular Malaysia.',
    culturalSignificance:'Kain limar forms part of Malaysia’s wider heritage of specialised weaving and ceremonial textiles.',
    characteristics:['Woven textile','Patterned threads','Decorative surface']
  },


  // ============================================================
  // TRADITIONAL GAMES — 7
  // ============================================================

  {
    id:'batu-seremban',
    slug:'batu-seremban',
    name:'Batu Seremban',
    category:'Traditional Games',
    image:'/images/archive/batu-seremban.jpg',
    shortDescription:'A hand-eye coordination game played with small fabric pieces or stones.',
    overview:'Players toss and collect small pieces in a sequence of increasingly difficult movements while keeping a thrown piece in motion.',
    origin:'Traditional game played in Malaysia.',
    culturalSignificance:'The game encourages dexterity, timing and social play using simple portable objects.',
    characteristics:['Small playing pieces','Throwing and catching','Sequential challenges']
  },

  {
    id:'gasing',
    slug:'gasing',
    name:'Gasing',
    category:'Traditional Games',
    image:'/images/archive/gasing.jpg',
    shortDescription:'A traditional spinning-top game with many regional forms.',
    overview:'A gasing is launched using a wound cord. Different styles of play can focus on spinning duration or competition between tops.',
    origin:'Traditional game found across Malaysia, especially in several Peninsular states.',
    culturalSignificance:'Gasing combines woodworking, skill, timing and competition and has long been associated with community recreation.',
    characteristics:['Spinning top','Cord-assisted launch','Multiple regional designs']
  },

  {
    id:'wau-bulan',
    slug:'wau-bulan',
    name:'Wau Bulan',
    category:'Traditional Games',
    image:'/images/archive/wau-bulan.jpg',
    shortDescription:'A large traditional kite recognised by its crescent-shaped lower section.',
    overview:'Wau Bulan is constructed around a lightweight frame and decorated with elaborate patterns before being flown using a long line.',
    origin:'Strongly associated with Kelantan, Malaysia.',
    culturalSignificance:'The wau combines recreational kite flying with decorative craftsmanship and regional artistic motifs.',
    characteristics:['Crescent-shaped form','Decorative patterns','Bamboo framework']
  },

  {
    id:'galah-panjang',
    slug:'galah-panjang',
    name:'Galah Panjang',
    category:'Traditional Games',
    image:'/images/archive/galah-panjang.jpg',
    shortDescription:'A team game based on passing through guarded lines.',
    overview:'Players are divided into attacking and defending teams on a marked court. Attackers attempt to cross sections without being touched by defenders.',
    origin:'Traditional Malaysian community game.',
    culturalSignificance:'The game encourages teamwork, quick movement, planning and group participation.',
    characteristics:['Two teams','Marked playing court','Running and strategy']
  },

  {
    id:'ketingting',
    slug:'ketingting',
    name:'Ketingting',
    category:'Traditional Games',
    image:'/images/archive/ketingting.jpg',
    shortDescription:'A hopping game played across boxes marked on the ground.',
    overview:'Players move through a sequence of marked spaces, often while balancing on one foot and following agreed rules.',
    origin:'Traditional game played in Malaysia.',
    culturalSignificance:'Ketingting demonstrates how simple outdoor spaces can become places for active and social play.',
    characteristics:['Ground markings','Hopping','Balance and coordination']
  },

  {
    id:'sepak-raga',
    slug:'sepak-raga',
    name:'Sepak Raga',
    category:'Traditional Games',
    image:'/images/archive/sepak-raga.jpg',
    shortDescription:'A traditional ball game centred on keeping a woven ball in the air.',
    overview:'Players use their feet and other permitted parts of the body to control a lightweight woven ball without letting it fall.',
    origin:'Malay world, including Malaysia.',
    culturalSignificance:'Sepak raga is closely connected with the development of modern sepak takraw and highlights coordination and group play.',
    characteristics:['Woven ball','Foot-based control','Group play']
  },

  {
    id:'tarik-upih',
    slug:'tarik-upih',
    name:'Tarik Upih',
    category:'Traditional Games',
    image:'/images/archive/tarik-upih.jpg',
    shortDescription:'A traditional race in which one person pulls another on a palm sheath.',
    overview:'One participant sits on a dried palm sheath while another pulls it across the ground toward a finishing point.',
    origin:'Traditional rural game in Malaysia.',
    culturalSignificance:'The activity transforms an everyday natural material into a simple game requiring strength and teamwork.',
    characteristics:['Palm sheath','Two-person activity','Racing']
  },


  // ============================================================
  // TRADITIONAL MUSIC & INSTRUMENTS — 7
  // ============================================================

  {
    id:'kompang',
    slug:'kompang',
    name:'Kompang',
    category:'Traditional Music & Instruments',
    image:'/images/archive/kompang.jpg',
    shortDescription:'A handheld frame drum widely used in Malay musical and ceremonial settings.',
    overview:'The kompang is struck by hand to produce interlocking rhythmic patterns. Groups of players often perform together.',
    origin:'Long established in Malay musical traditions in Malaysia.',
    culturalSignificance:'Kompang performances frequently accompany weddings, processions and community celebrations.',
    characteristics:['Frame drum','Played by hand','Group rhythms']
  },

  {
    id:'rebana',
    slug:'rebana',
    name:'Rebana',
    category:'Traditional Music & Instruments',
    image:'/images/archive/rebana.jpg',
    shortDescription:'A family of traditional drums used in several Malaysian performance traditions.',
    overview:'Rebana drums vary in size and construction and are used to create rhythmic accompaniment for music, song and ceremonial performance.',
    origin:'Used across Malay communities in Malaysia and the wider region.',
    culturalSignificance:'Different rebana traditions show the variety of percussion practices found across Malaysian communities.',
    characteristics:['Drum','Hand-played percussion','Several regional forms']
  },

  {
    id:'gambus',
    slug:'gambus',
    name:'Gambus',
    category:'Traditional Music & Instruments',
    image:'/images/archive/gambus.jpg',
    shortDescription:'A plucked string instrument used in several Malay musical traditions.',
    overview:'The gambus has a rounded body and strings that are plucked to accompany ensemble music and singing.',
    origin:'Part of musical traditions shaped by connections between the Malay world and West Asia.',
    culturalSignificance:'In Malaysia it is particularly associated with forms of traditional music and dance including zapin.',
    characteristics:['Plucked strings','Rounded body','Ensemble instrument']
  },

  {
    id:'sape',
    slug:'sape',
    name:'Sape',
    category:'Traditional Music & Instruments',
    image:'/images/archive/sape.jpg',
    shortDescription:'A traditional plucked lute associated with Orang Ulu communities of Borneo.',
    overview:'The sape is carved from wood and played by plucking its strings. Contemporary instruments may have more strings than earlier forms.',
    origin:'Orang Ulu communities of Sarawak and Borneo.',
    culturalSignificance:'The instrument is strongly associated with the musical heritage of several indigenous communities in Sarawak.',
    characteristics:['Carved wooden body','Plucked strings','Bornean musical tradition']
  },

  {
    id:'gamelan-melayu',
    slug:'gamelan-melayu',
    name:'Gamelan Melayu',
    category:'Traditional Music & Instruments',
    image:'/images/archive/gamelan-melayu.jpg',
    shortDescription:'An ensemble tradition using tuned percussion and other instruments.',
    overview:'Malay gamelan performances combine instruments such as metallophones, gongs and drums to create layered melodic and rhythmic patterns.',
    origin:'Developed in the Malay Peninsula through wider regional cultural exchange.',
    culturalSignificance:'The tradition forms part of Malaysia’s court and performance heritage, particularly in Pahang and Terengganu.',
    characteristics:['Ensemble music','Tuned percussion','Gongs and drums']
  },

  {
    id:'serunai',
    slug:'serunai',
    name:'Serunai',
    category:'Traditional Music & Instruments',
    image:'/images/archive/serunai.jpg',
    shortDescription:'A traditional wind instrument with a strong penetrating sound.',
    overview:'The serunai uses a reed to create its distinctive tone and is played in several traditional musical settings.',
    origin:'Malay musical traditions in Malaysia and the wider region.',
    culturalSignificance:'Its distinctive sound is associated with traditional ensembles, ceremonies and performances.',
    characteristics:['Wind instrument','Reed sound','Strong projecting tone']
  },

  {
    id:'sompoton',
    slug:'sompoton',
    name:'Sompoton',
    category:'Traditional Music & Instruments',
    image:'/images/archive/sompoton.jpg',
    shortDescription:'A mouth organ traditionally associated with communities in Sabah.',
    overview:'The sompoton is made from several bamboo pipes fitted into a gourd. Air blown and drawn through the instrument produces its notes.',
    origin:'Sabah, Malaysia; strongly associated with Kadazandusun communities.',
    culturalSignificance:'The instrument demonstrates traditional knowledge of bamboo, gourds and sound-making techniques.',
    characteristics:['Bamboo pipes','Gourd body','Mouth organ']
  },


  // ============================================================
  // ARTS & CRAFTS — 7
  // ============================================================

  {
    id:'anyaman-mengkuang',
    slug:'anyaman-mengkuang',
    name:'Anyaman Mengkuang',
    category:'Arts & Crafts',
    image:'/images/archive/anyaman-mengkuang.jpg',
    shortDescription:'Traditional weaving using prepared mengkuang leaves.',
    overview:'Leaves are processed, dried and arranged into repeated woven patterns to create objects such as mats, containers and decorative pieces.',
    origin:'Practised in several communities across Malaysia.',
    culturalSignificance:'The craft transforms locally available plant material into useful and decorative objects through learned weaving skills.',
    characteristics:['Plant fibres','Handwoven patterns','Functional craft']
  },

  {
    id:'ukiran-kayu-melayu',
    slug:'ukiran-kayu-melayu',
    name:'Ukiran Kayu Melayu',
    category:'Arts & Crafts',
    image:'/images/archive/ukiran-kayu-melayu.jpg',
    shortDescription:'Malay woodcarving featuring decorative geometric and nature-inspired motifs.',
    overview:'Woodcarving can be found on architectural panels, furniture and decorative objects, often using repeating floral or geometric compositions.',
    origin:'Malay communities in Peninsular Malaysia.',
    culturalSignificance:'Traditional carving connects craft knowledge with architecture, decoration and skilled woodworking.',
    characteristics:['Carved wood','Floral motifs','Geometric motifs']
  },

  {
    id:'tekat-emas',
    slug:'tekat-emas',
    name:'Tekat Emas',
    category:'Arts & Crafts',
    image:'/images/archive/tekat-emas.jpg',
    shortDescription:'Decorative embroidery using metallic thread over raised designs.',
    overview:'Tekat creates raised patterns by laying metallic thread over a prepared base, producing richly textured decorative surfaces.',
    origin:'Strongly associated with Perak, Malaysia.',
    culturalSignificance:'The technique is associated with ceremonial objects, decoration and specialised needlework traditions.',
    characteristics:['Metallic thread','Raised embroidery','Decorative motifs']
  },

  {
    id:'tembikar-terenang',
    slug:'tembikar-terenang',
    name:'Tembikar Terenang',
    category:'Arts & Crafts',
    image:'/images/archive/tembikar-terenang.jpg',
    shortDescription:'A traditional pottery form particularly associated with Pahang.',
    overview:'Terenang vessels are shaped from clay and decorated using traditional surface patterns before firing.',
    origin:'Pahang, Malaysia.',
    culturalSignificance:'The pottery preserves local knowledge of clay preparation, vessel forming and surface decoration.',
    characteristics:['Clay vessel','Decorated surface','Traditional pottery']
  },

  {
    id:'keringkam-embroidery',
    slug:'keringkam-embroidery',
    name:'Keringkam Embroidery',
    category:'Arts & Crafts',
    image:'/images/archive/keringkam-embroidery.jpg',
    shortDescription:'Fine metallic embroidery associated particularly with Sarawak Malay craftsmanship.',
    overview:'Keringkam uses thin metallic material to create decorative motifs on fabric, including scarves and ceremonial textiles.',
    origin:'Sarawak, Malaysia.',
    culturalSignificance:'The craft represents detailed textile work requiring patience, specialised materials and learned decorative techniques.',
    characteristics:['Metallic embroidery','Fine decorative work','Textile craft']
  },

  {
    id:'orang-ulu-beadwork',
    slug:'orang-ulu-beadwork',
    name:'Orang Ulu Beadwork',
    category:'Arts & Crafts',
    image:'/images/archive/orang-ulu-beadwork.jpg',
    shortDescription:'Detailed beadwork associated with Orang Ulu communities in Sarawak.',
    overview:'Small coloured beads are arranged into complex geometric and figurative patterns used on clothing, accessories and decorative objects.',
    origin:'Orang Ulu communities of Sarawak, Malaysia.',
    culturalSignificance:'Beadwork provides a visual expression of community identity, craftsmanship and inherited pattern traditions.',
    characteristics:['Colourful beads','Repeated motifs','Detailed handwork']
  },

  {
    id:'batik-block-printing',
    slug:'batik-block-printing',
    name:'Batik Block Printing',
    category:'Arts & Crafts',
    image:'/images/archive/batik-block-printing.jpg',
    shortDescription:'A batik technique using patterned blocks to apply wax to fabric.',
    overview:'A carved or formed block is dipped into hot wax and pressed repeatedly onto cloth before dyeing, creating repeating designs.',
    origin:'Practised by Malaysian batik makers within the wider regional batik tradition.',
    culturalSignificance:'Block printing demonstrates the production process behind many repeating batik patterns.',
    characteristics:['Pattern block','Wax resist','Repeated textile motifs']
  },


  // ============================================================
  // HERITAGE OBJECTS — 7
  // ============================================================

  {
    id:'tepak-sirih',
    slug:'tepak-sirih',
    name:'Tepak Sirih',
    category:'Heritage Objects',
    image:'/images/archive/tepak-sirih.jpg',
    shortDescription:'A traditional container set associated with the preparation and presentation of betel.',
    overview:'A tepak sirih usually contains several smaller containers arranged within a larger case for ingredients used in betel preparation.',
    origin:'Malay cultural traditions in Malaysia and the wider region.',
    culturalSignificance:'Historically, the set could form part of hospitality, ceremony and formal social customs.',
    characteristics:['Container set','Multiple compartments','Ceremonial object']
  },

  {
    id:'kendi',
    slug:'kendi',
    name:'Kendi',
    category:'Heritage Objects',
    image:'/images/archive/kendi.jpg',
    shortDescription:'A traditional water vessel with a distinctive pouring spout.',
    overview:'Kendi vessels are commonly made from clay or ceramic material and shaped to hold and pour liquids.',
    origin:'Used historically in Malaysia and across Southeast Asia.',
    culturalSignificance:'The vessel illustrates earlier approaches to storing, serving and drinking water.',
    characteristics:['Water vessel','Spout','Ceramic or earthenware']
  },

  {
    id:'kukur-kelapa',
    slug:'kukur-kelapa',
    name:'Kukur Kelapa',
    category:'Heritage Objects',
    image:'/images/archive/kukur-kelapa.jpg',
    shortDescription:'A traditional tool used to grate coconut flesh.',
    overview:'The tool combines a serrated metal grater with a low seat or wooden base, allowing coconut flesh to be scraped directly from the shell.',
    origin:'Common in traditional Malaysian households.',
    culturalSignificance:'It reflects the importance of coconut in local cooking and the practical tools developed for food preparation.',
    characteristics:['Metal grater','Wooden base','Coconut preparation tool']
  },

  {
    id:'pelita-minyak',
    slug:'pelita-minyak',
    name:'Pelita Minyak',
    category:'Heritage Objects',
    image:'/images/archive/pelita-minyak.jpg',
    shortDescription:'A small traditional oil lamp used before electric lighting became widespread.',
    overview:'A pelita produces light from a burning wick supplied by oil held in a small container.',
    origin:'Historically used in homes and communities throughout Malaysia.',
    culturalSignificance:'Pelita are remembered both as practical lighting objects and as decorative lights during celebrations.',
    characteristics:['Oil container','Wick','Small flame']
  },

  {
    id:'seterika-arang',
    slug:'seterika-arang',
    name:'Seterika Arang',
    category:'Heritage Objects',
    image:'/images/archive/seterika-arang.jpg',
    shortDescription:'A heavy iron heated using burning charcoal.',
    overview:'Charcoal is placed inside the metal body of the iron, creating heat that is transferred through the base to press clothing.',
    origin:'Historically used in Malaysian households before electric irons became common.',
    culturalSignificance:'The object shows how everyday household work was carried out before widespread electrification.',
    characteristics:['Metal body','Charcoal compartment','Heavy flat base']
  },

  {
    id:'mesin-jahit-kaki',
    slug:'mesin-jahit-kaki',
    name:'Mesin Jahit Kaki',
    category:'Heritage Objects',
    image:'/images/archive/mesin-jahit-kaki.jpg',
    shortDescription:'A treadle sewing machine operated through foot-powered mechanical movement.',
    overview:'The user moves a foot treadle that drives the sewing mechanism through belts and a flywheel without requiring electricity.',
    origin:'Once widely used in homes and tailoring businesses throughout Malaysia.',
    culturalSignificance:'Treadle machines are closely connected with domestic sewing, tailoring and small family businesses of earlier generations.',
    characteristics:['Foot treadle','Mechanical flywheel','Non-electric operation']
  },

  {
    id:'tempayan',
    slug:'tempayan',
    name:'Tempayan',
    category:'Heritage Objects',
    image:'/images/archive/tempayan.jpg',
    shortDescription:'A large ceramic jar traditionally used for storage.',
    overview:'Tempayan jars have been used to hold water, food and other materials. Their forms, sizes and uses differ between communities.',
    origin:'Historically used throughout Malaysia and wider Southeast Asia.',
    culturalSignificance:'Large jars reflect earlier household storage practices and, in some communities, can also have ceremonial importance.',
    characteristics:['Large ceramic jar','Storage vessel','Wide body']
  },


  // ============================================================
  // ARCHITECTURE & LANDMARKS — 7
  // ============================================================

  {
    id:'a-famosa',
    slug:'a-famosa',
    name:'A Famosa',
    category:'Architecture & Landmarks',
    image:'/images/archive/a-famosa.jpg',
    shortDescription:'Remains of a Portuguese fortification in Melaka.',
    overview:'The surviving Porta de Santiago gateway is one of the most recognisable remnants associated with the former Portuguese fortress in Melaka.',
    origin:'Melaka, Malaysia.',
    culturalSignificance:'The remains provide a visible connection to Melaka’s long history of maritime trade and European colonial rule.',
    characteristics:['Stone gateway','Fortification remains','Historic Melaka landmark']
  },

  {
    id:'stadthuys',
    slug:'stadthuys',
    name:'The Stadthuys',
    category:'Architecture & Landmarks',
    image:'/images/archive/stadthuys.jpg',
    shortDescription:'A prominent historic Dutch-era building in central Melaka.',
    overview:'The Stadthuys forms part of the historic civic area around Melaka’s Dutch Square and is recognised by its distinctive red exterior.',
    origin:'Melaka, Malaysia.',
    culturalSignificance:'The building reflects one period in Melaka’s layered colonial and administrative history.',
    characteristics:['Dutch-era architecture','Red exterior','Historic civic building']
  },

  {
    id:'sultan-abdul-samad-building',
    slug:'sultan-abdul-samad-building',
    name:'Sultan Abdul Samad Building',
    category:'Architecture & Landmarks',
    image:'/images/archive/sultan-abdul-samad-building.jpg',
    shortDescription:'A landmark historic government building facing Dataran Merdeka.',
    overview:'The building is recognised by its long façade, arches, domes and central clock tower.',
    origin:'Kuala Lumpur, Malaysia.',
    culturalSignificance:'Its position beside Dataran Merdeka connects the building with major moments in Kuala Lumpur and Malaysia’s civic history.',
    characteristics:['Clock tower','Arched façade','Domed features']
  },

  {
    id:'masjid-jamek-kuala-lumpur',
    slug:'masjid-jamek-kuala-lumpur',
    name:'Masjid Jamek Kuala Lumpur',
    category:'Architecture & Landmarks',
    image:'/images/archive/masjid-jamek-kuala-lumpur.jpg',
    shortDescription:'A historic mosque located near the meeting point of the Klang and Gombak rivers.',
    overview:'Masjid Jamek is one of central Kuala Lumpur’s long-established religious landmarks and features domes, minarets and arcaded architectural elements.',
    origin:'Kuala Lumpur, Malaysia.',
    culturalSignificance:'The mosque forms part of the historic urban landscape around the early centre of Kuala Lumpur.',
    characteristics:['Domes','Minarets','Riverside location']
  },

  {
    id:'kek-lok-si',
    slug:'kek-lok-si',
    name:'Kek Lok Si Temple',
    category:'Architecture & Landmarks',
    image:'/images/archive/kek-lok-si.jpg',
    shortDescription:'A major Buddhist temple complex in Air Itam, Penang.',
    overview:'Kek Lok Si contains prayer halls, courtyards, statues and a prominent multi-tiered pagoda built across a hillside setting.',
    origin:'Air Itam, Penang, Malaysia.',
    culturalSignificance:'The temple is an important religious and architectural landmark for Malaysia’s Buddhist communities.',
    characteristics:['Temple complex','Pagoda','Hillside setting']
  },

  {
    id:'fort-margherita',
    slug:'fort-margherita',
    name:'Fort Margherita',
    category:'Architecture & Landmarks',
    image:'/images/archive/fort-margherita.jpg',
    shortDescription:'A historic fort overlooking the Sarawak River in Kuching.',
    overview:'Fort Margherita was constructed during the Brooke era and occupies a strategic position beside the Sarawak River.',
    origin:'Kuching, Sarawak, Malaysia.',
    culturalSignificance:'The fort provides a physical link to Sarawak’s nineteenth-century political and defensive history.',
    characteristics:['Fort structure','River-facing position','Brooke-era architecture']
  },

  {
    id:'rumah-penghulu-abu-seman',
    slug:'rumah-penghulu-abu-seman',
    name:'Rumah Penghulu Abu Seman',
    category:'Architecture & Landmarks',
    image:'/images/archive/rumah-penghulu-abu-seman.jpg',
    shortDescription:'A preserved traditional Malay house now located in Kuala Lumpur.',
    overview:'The timber house demonstrates traditional Malay domestic construction, including raised floors, timber joinery and a roof adapted to the tropical climate.',
    origin:'Originally from Kedah; now preserved in Kuala Lumpur, Malaysia.',
    culturalSignificance:'The house provides an accessible example of traditional Malay residential architecture and craftsmanship.',
    characteristics:['Timber construction','Raised floor','Traditional Malay house']
  },


  // ============================================================
  // PLACES & COMMUNITIES — 7
  // ============================================================

  {
    id:'kampung-baru-kuala-lumpur',
    slug:'kampung-baru-kuala-lumpur',
    name:'Kampung Baru Kuala Lumpur',
    category:'Places & Communities',
    image:'/images/archive/kampung-baru-kuala-lumpur.jpg',
    shortDescription:'A historic Malay neighbourhood in the centre of Kuala Lumpur.',
    overview:'Kampung Baru contains homes, food businesses, community institutions and streets that contrast with the surrounding modern city skyline.',
    origin:'Kuala Lumpur, Malaysia.',
    culturalSignificance:'The neighbourhood represents the continuing presence of a long-established Malay community within central Kuala Lumpur.',
    characteristics:['Urban village','Malay community','Traditional and modern buildings']
  },

  {
    id:'kampung-morten',
    slug:'kampung-morten',
    name:'Kampung Morten',
    category:'Places & Communities',
    image:'/images/archive/kampung-morten.jpg',
    shortDescription:'A traditional Malay village situated beside the Melaka River.',
    overview:'Kampung Morten contains traditional-style Malay houses within the modern city of Melaka.',
    origin:'Melaka, Malaysia.',
    culturalSignificance:'The village provides a view of Malay domestic architecture and community life within a rapidly changing urban environment.',
    characteristics:['Malay houses','Riverside village','Urban heritage setting']
  },

  {
    id:'chew-jetty',
    slug:'chew-jetty',
    name:'Chew Jetty',
    category:'Places & Communities',
    image:'/images/archive/chew-jetty.jpg',
    shortDescription:'A historic waterfront clan settlement in George Town.',
    overview:'Chew Jetty consists of homes and walkways built on stilts extending over the waterfront.',
    origin:'George Town, Penang, Malaysia.',
    culturalSignificance:'The settlement reflects the history of Chinese clan communities connected with Penang’s waterfront economy.',
    characteristics:['Stilt houses','Wooden walkways','Waterfront settlement']
  },

  {
    id:'portuguese-settlement-melaka',
    slug:'portuguese-settlement-melaka',
    name:'Portuguese Settlement Melaka',
    category:'Places & Communities',
    image:'/images/archive/portuguese-settlement-melaka.jpg',
    shortDescription:'A neighbourhood associated with Melaka’s Kristang community.',
    overview:'The settlement is home to families whose cultural traditions reflect centuries of interaction between Portuguese and local communities.',
    origin:'Melaka, Malaysia.',
    culturalSignificance:'Language, food, music and celebrations within the community form a distinctive part of Melaka’s multicultural heritage.',
    characteristics:['Kristang community','Coastal neighbourhood','Distinctive cultural traditions']
  },

  {
    id:'bario-highlands',
    slug:'bario-highlands',
    name:'Bario Highlands',
    category:'Places & Communities',
    image:'/images/archive/bario-highlands.jpg',
    shortDescription:'A highland settlement area associated strongly with the Kelabit community.',
    overview:'Bario lies within the interior highlands of Sarawak and is known for its agricultural landscape, longhouse traditions and Kelabit community.',
    origin:'Sarawak, Malaysia.',
    culturalSignificance:'The area provides an important setting for Kelabit cultural practices, food traditions and community life.',
    characteristics:['Highland landscape','Kelabit community','Rice cultivation']
  },

  {
    id:'mah-meri-carey-island',
    slug:'mah-meri-carey-island',
    name:'Mah Meri Community of Carey Island',
    category:'Places & Communities',
    image:'/images/archive/mah-meri-carey-island.jpg',
    shortDescription:'An Orang Asli community known especially for distinctive carving and cultural traditions.',
    overview:'Mah Meri communities on Carey Island maintain cultural practices that include woodcarving, weaving, ceremonies and traditional performance.',
    origin:'Carey Island, Selangor, Malaysia.',
    culturalSignificance:'The community represents part of the cultural diversity of Malaysia’s Orang Asli peoples.',
    characteristics:['Orang Asli community','Woodcarving traditions','Ceremonial arts']
  },

  {
    id:'sarawak-cultural-village',
    slug:'sarawak-cultural-village',
    name:'Sarawak Cultural Village',
    category:'Places & Communities',
    image:'/images/archive/sarawak-cultural-village.jpg',
    shortDescription:'A cultural centre presenting architectural and cultural traditions from communities across Sarawak.',
    overview:'The village contains reconstructed traditional buildings and spaces representing several of Sarawak’s communities.',
    origin:'Santubong, Sarawak, Malaysia.',
    culturalSignificance:'It provides visitors with an introduction to the diversity of Sarawak’s architecture, performance, craft and community traditions.',
    characteristics:['Traditional buildings','Cultural demonstrations','Multiple Sarawak communities']
  },


  // ============================================================
  // NATURE & WILDLIFE — 7
  // ============================================================

  {
    id:'bunga-raya',
    slug:'bunga-raya',
    name:'Bunga Raya',
    category:'Nature & Wildlife',
    image:'/images/archive/bunga-raya.jpg',
    shortDescription:'The hibiscus flower recognised as Malaysia’s national flower.',
    overview:'Bunga raya is known for its large petals and prominent central structure and is commonly seen in tropical gardens.',
    origin:'Widely grown in Malaysia.',
    culturalSignificance:'The flower has become a widely recognised visual symbol associated with Malaysia.',
    characteristics:['Large petals','Bright flowers','National floral symbol']
  },

  {
    id:'rafflesia',
    slug:'rafflesia',
    name:'Rafflesia',
    category:'Nature & Wildlife',
    image:'/images/archive/rafflesia.jpg',
    shortDescription:'A parasitic flowering plant famous for producing exceptionally large flowers.',
    overview:'Rafflesia species lack conventional leaves and stems and spend much of their life within their host plant before flowering.',
    origin:'Rainforests of Southeast Asia, including Malaysia.',
    culturalSignificance:'Rafflesia has become an important symbol of rainforest biodiversity, especially in parts of Sabah and Sarawak.',
    characteristics:['Very large flower','Parasitic plant','Rainforest habitat']
  },

  {
    id:'malayan-tiger',
    slug:'malayan-tiger',
    name:'Malayan Tiger',
    category:'Nature & Wildlife',
    image:'/images/archive/malayan-tiger.jpg',
    shortDescription:'A tiger population native to Peninsular Malaysia.',
    overview:'The Malayan tiger inhabits forest environments and is one of Malaysia’s most recognisable native mammals.',
    origin:'Peninsular Malaysia.',
    culturalSignificance:'The tiger appears in Malaysian symbolism, visual culture and conservation efforts.',
    characteristics:['Striped coat','Large carnivore','Forest habitat']
  },

  {
    id:'malayan-tapir',
    slug:'malayan-tapir',
    name:'Malayan Tapir',
    category:'Nature & Wildlife',
    image:'/images/archive/malayan-tapir.jpg',
    shortDescription:'A distinctive forest mammal recognised by its black-and-white colouring.',
    overview:'The Malayan tapir has a large body, short trunk-like snout and a contrasting pale section across its middle.',
    origin:'Southeast Asia, including Peninsular Malaysia.',
    culturalSignificance:'Its unusual appearance makes it one of Malaysia’s most recognisable native mammals and an important focus of wildlife conservation.',
    characteristics:['Black-and-white colouring','Short flexible snout','Forest-dwelling mammal']
  },

  {
    id:'rhinoceros-hornbill',
    slug:'rhinoceros-hornbill',
    name:'Rhinoceros Hornbill',
    category:'Nature & Wildlife',
    image:'/images/archive/rhinoceros-hornbill.jpg',
    shortDescription:'A large rainforest bird recognised by the casque above its bill.',
    overview:'The rhinoceros hornbill lives in forest canopies and has a large curved bill topped with a prominent casque.',
    origin:'Southeast Asian rainforests, including Malaysia.',
    culturalSignificance:'Hornbills have particular cultural importance in parts of Borneo and are strongly associated with Sarawak.',
    characteristics:['Large bill','Prominent casque','Rainforest bird']
  },

  {
    id:'bornean-orangutan',
    slug:'bornean-orangutan',
    name:'Bornean Orangutan',
    category:'Nature & Wildlife',
    image:'/images/archive/bornean-orangutan.jpg',
    shortDescription:'A great ape native to the forests of Borneo.',
    overview:'Bornean orangutans spend much of their lives in trees and are recognisable by their long arms and reddish-brown hair.',
    origin:'Borneo, including Sabah and Sarawak in Malaysia.',
    culturalSignificance:'The species represents the extraordinary biodiversity of Borneo and the importance of protecting rainforest habitats.',
    characteristics:['Reddish-brown hair','Long arms','Tree-dwelling great ape']
  },

  {
    id:'malaysian-mangrove-forest',
    slug:'malaysian-mangrove-forest',
    name:'Malaysian Mangrove Forest',
    category:'Nature & Wildlife',
    image:'/images/archive/malaysian-mangrove-forest.jpg',
    shortDescription:'Coastal forests adapted to tidal and salty environments.',
    overview:'Mangroves grow along sheltered coasts and river mouths, where specialised roots help trees survive waterlogged and saline conditions.',
    origin:'Coastal areas throughout Malaysia.',
    culturalSignificance:'Mangrove landscapes support wildlife, fisheries and coastal communities while helping reduce erosion and wave impact.',
    characteristics:['Tidal environment','Specialised roots','Coastal ecosystem']
  },


  // ============================================================
  // FESTIVALS & TRADITIONS — 6
  // ============================================================

  {
    id:'hari-raya-open-house',
    slug:'hari-raya-open-house',
    name:'Hari Raya Open House',
    category:'Festivals & Traditions',
    image:'/images/archive/hari-raya-open-house.jpg',
    shortDescription:'A festive gathering tradition associated with Hari Raya Aidilfitri.',
    overview:'Families, communities and organisations may welcome guests to share food and spend time together during the Hari Raya period.',
    origin:'Muslim communities throughout Malaysia.',
    culturalSignificance:'Open-house gatherings encourage visiting, hospitality and social connection during the festive season.',
    characteristics:['Visiting guests','Shared food','Festive hospitality']
  },

  {
    id:'chinese-new-year-lion-dance',
    slug:'chinese-new-year-lion-dance',
    name:'Chinese New Year Lion Dance',
    category:'Festivals & Traditions',
    image:'/images/archive/chinese-new-year-lion-dance.jpg',
    shortDescription:'A highly visible performance tradition during Chinese New Year celebrations.',
    overview:'Performers operate a decorated lion costume while moving to rhythmic percussion, often including drums, cymbals and gongs.',
    origin:'Chinese tradition practised widely by Chinese Malaysian communities.',
    culturalSignificance:'Lion dance has become a familiar part of festive celebrations in Malaysian towns, homes and businesses.',
    characteristics:['Lion costume','Percussion','Acrobatic movement']
  },

  {
    id:'deepavali-kolam',
    slug:'deepavali-kolam',
    name:'Deepavali Kolam',
    category:'Festivals & Traditions',
    image:'/images/archive/deepavali-kolam.jpg',
    shortDescription:'Decorative floor designs commonly created during Deepavali.',
    overview:'Kolam designs are arranged near entrances using materials such as coloured rice, rice flour or other decorative media.',
    origin:'South Asian tradition maintained by Indian communities in Malaysia.',
    culturalSignificance:'During Deepavali, colourful kolam designs form part of the visual landscape of Malaysian homes, temples and public spaces.',
    characteristics:['Floor design','Geometric or floral patterns','Colourful materials']
  },

  {
    id:'thaipusam',
    slug:'thaipusam',
    name:'Thaipusam',
    category:'Festivals & Traditions',
    image:'/images/archive/thaipusam.jpg',
    shortDescription:'A Hindu festival marked prominently by Tamil communities in Malaysia.',
    overview:'Thaipusam observances include temple worship, processions and acts of devotion, with Batu Caves serving as one of Malaysia’s best-known gathering locations.',
    origin:'Hindu Tamil tradition practised in Malaysia and other countries.',
    culturalSignificance:'The festival forms an important part of the religious and cultural calendar for many Malaysian Hindus.',
    characteristics:['Temple worship','Processions','Acts of devotion']
  },

  {
    id:'gawai-dayak',
    slug:'gawai-dayak',
    name:'Gawai Dayak',
    category:'Festivals & Traditions',
    image:'/images/archive/gawai-dayak.jpg',
    shortDescription:'A major celebration associated with Dayak communities in Sarawak.',
    overview:'Gawai Dayak is celebrated around the beginning of June with gatherings, food, music, dance and visits between families and communities.',
    origin:'Sarawak, Malaysia.',
    culturalSignificance:'The celebration highlights community identity, hospitality and cultural traditions among Dayak peoples of Sarawak.',
    characteristics:['Community gatherings','Traditional food','Music and dance']
  },

  {
    id:'kaamatan',
    slug:'kaamatan',
    name:'Kaamatan',
    category:'Festivals & Traditions',
    image:'/images/archive/kaamatan.jpg',
    shortDescription:'A harvest festival strongly associated with Kadazandusun and related communities in Sabah.',
    overview:'Kaamatan celebrations include cultural performances, gatherings, food and activities connected with harvest traditions.',
    origin:'Sabah, Malaysia.',
    culturalSignificance:'The festival celebrates community, agricultural heritage and cultural identity in Sabah.',
    characteristics:['Harvest celebration','Cultural performances','Community gatherings']
  },


  // ============================================================
  // LOCAL BRANDS & PRODUCTS — 6
  // ============================================================

  {
    id:'boh-tea',
    slug:'boh-tea',
    name:'BOH Tea',
    category:'Local Brands & Products',
    image:'/images/archive/boh-tea.jpg',
    shortDescription:'A Malaysian tea brand closely associated with the Cameron Highlands.',
    overview:'BOH tea is connected with Malaysia’s highland tea-growing landscape and has become a familiar product in Malaysian homes and shops.',
    origin:'Malaysia.',
    culturalSignificance:'The brand provides a starting point for exploring tea cultivation, colonial-era agriculture and the development of Malaysian consumer products.',
    characteristics:['Malaysian tea','Highland plantations','Packaged consumer product']
  },

  {
    id:'royal-selangor',
    slug:'royal-selangor',
    name:'Royal Selangor',
    category:'Local Brands & Products',
    image:'/images/archive/royal-selangor.jpg',
    shortDescription:'A Malaysian company internationally known for pewter craftsmanship.',
    overview:'Royal Selangor produces pewter objects through processes that combine metalworking with decorative and industrial design.',
    origin:'Kuala Lumpur, Malaysia.',
    culturalSignificance:'Its history connects Kuala Lumpur’s tin industry with the development of specialised Malaysian pewter craftsmanship.',
    characteristics:['Pewter products','Metal craftsmanship','Malaysian brand']
  },

  {
    id:'mamee',
    slug:'mamee',
    name:'Mamee',
    category:'Local Brands & Products',
    image:'/images/archive/mamee.jpg',
    shortDescription:'A Malaysian food brand known for noodles and snack products.',
    overview:'Mamee grew from Malaysian food manufacturing and became particularly recognisable through instant noodles and crunchy noodle snacks.',
    origin:'Melaka, Malaysia.',
    culturalSignificance:'Its products form part of the everyday consumer culture remembered by several generations of Malaysians.',
    characteristics:['Food brand','Noodle products','Packaged snacks']
  },

  {
    id:'ramly',
    slug:'ramly',
    name:'Ramly',
    category:'Local Brands & Products',
    image:'/images/archive/ramly.jpg',
    shortDescription:'A Malaysian food brand strongly associated with the local burger-stall culture.',
    overview:'Ramly products became closely connected with independently operated roadside and night-market burger stalls throughout Malaysia.',
    origin:'Malaysia.',
    culturalSignificance:'The Ramly burger has developed into a recognisable part of Malaysian street-food and late-night eating culture.',
    characteristics:['Local food brand','Burger products','Street-food association']
  },

  {
    id:'julies-biscuits',
    slug:'julies-biscuits',
    name:"Julie's Biscuits",
    category:'Local Brands & Products',
    image:'/images/archive/julies-biscuits.jpg',
    shortDescription:'A Malaysian biscuit brand distributed locally and internationally.',
    overview:'Julie’s produces packaged biscuits and crackers that have become familiar products in Malaysian supermarkets and homes.',
    origin:'Melaka, Malaysia.',
    culturalSignificance:'The brand represents the development of Malaysian packaged-food manufacturing into both domestic and export markets.',
    characteristics:['Biscuits','Packaged food','Malaysian brand']
  },

  {
    id:'kluang-rail-coffee',
    slug:'kluang-rail-coffee',
    name:'Kluang Rail Coffee',
    category:'Local Brands & Products',
    image:'/images/archive/kluang-rail-coffee.jpg',
    shortDescription:'A Malaysian coffee business closely associated with Kluang railway station.',
    overview:'The coffee shop tradition combines local coffee, toast and simple meals with the atmosphere of railway travel.',
    origin:'Kluang, Johor, Malaysia.',
    culturalSignificance:'It connects kopitiam-style food culture with the social history of Malaysia’s railway towns.',
    characteristics:['Local coffee','Railway setting','Kopitiam food culture']
  },


  // ============================================================
  // TRANSPORT & MOBILITY — 6
  // ============================================================

  {
    id:'beca-melaka',
    slug:'beca-melaka',
    name:'Beca Melaka',
    category:'Transport & Mobility',
    image:'/images/archive/beca-melaka.jpg',
    shortDescription:'Three-wheeled passenger trishaws that remain a familiar sight in Melaka.',
    overview:'A beca is human-powered, traditionally using a bicycle mechanism connected to a passenger seat. Modern Melaka trishaws are often brightly decorated.',
    origin:'Historically used in Malaysian towns; strongly associated today with Melaka.',
    culturalSignificance:'Beca recall an earlier form of urban passenger transport while continuing today largely through tourism.',
    characteristics:['Three wheels','Pedal powered','Passenger seat']
  },

  {
    id:'penang-ferry',
    slug:'penang-ferry',
    name:'Penang Ferry',
    category:'Transport & Mobility',
    image:'/images/archive/penang-ferry.jpg',
    shortDescription:'A long-running ferry connection between Penang Island and the mainland.',
    overview:'Ferry services across the Penang Strait have connected George Town and Butterworth for generations, even as the vessels and service have changed.',
    origin:'Penang, Malaysia.',
    culturalSignificance:'For many residents and travellers, the ferry is closely associated with the everyday experience and transport history of Penang.',
    characteristics:['Water transport','Island-mainland connection','Passenger service']
  },

  {
    id:'kuala-lumpur-mini-bus',
    slug:'kuala-lumpur-mini-bus',
    name:'Kuala Lumpur Mini Bus',
    category:'Transport & Mobility',
    image:'/images/archive/kuala-lumpur-mini-bus.jpg',
    shortDescription:'Small urban buses remembered as part of Kuala Lumpur’s earlier public transport system.',
    overview:'Mini buses once operated numerous routes around Kuala Lumpur and became recognisable features of the city’s busy streets.',
    origin:'Kuala Lumpur, Malaysia.',
    culturalSignificance:'The vehicles are remembered as part of the everyday commuting experience of Kuala Lumpur before later public transport systems expanded.',
    characteristics:['Small city bus','Urban routes','Historic public transport']
  },

  {
    id:'ktm-railway',
    slug:'ktm-railway',
    name:'KTM Railway',
    category:'Transport & Mobility',
    image:'/images/archive/ktm-railway.jpg',
    shortDescription:'Malaysia’s long-established railway network connecting towns and regions.',
    overview:'Railways developed across the Malay Peninsula to move passengers and goods and later became part of the national transport network operated by KTM.',
    origin:'Peninsular Malaysia.',
    culturalSignificance:'Railway stations, tracks and trains shaped travel, trade and the growth of numerous Malaysian towns.',
    characteristics:['Rail transport','Historic stations','Intercity connections']
  },

  {
    id:'proton-saga',
    slug:'proton-saga',
    name:'Proton Saga',
    category:'Transport & Mobility',
    image:'/images/archive/proton-saga.jpg',
    shortDescription:'The first production model launched by Malaysian car manufacturer Proton.',
    overview:'The Proton Saga became a common sight on Malaysian roads and marked an important stage in the development of the country’s automotive industry.',
    origin:'Malaysia.',
    culturalSignificance:'For many Malaysians, early Saga models are associated with the growth of local car manufacturing and everyday family transport.',
    characteristics:['Passenger car','Malaysian automotive product','Widely used locally']
  },

  {
    id:'perahu-panjang',
    slug:'perahu-panjang',
    name:'Perahu Panjang',
    category:'Transport & Mobility',
    image:'/images/archive/perahu-panjang.jpg',
    shortDescription:'A long river boat traditionally used by communities in parts of Borneo.',
    overview:'Long narrow boats are suited to navigating rivers and can carry several passengers through inland areas where waterways function as transport routes.',
    origin:'Sabah and Sarawak, Malaysia, and wider Borneo.',
    culturalSignificance:'River boats illustrate the importance of waterways to travel, trade and community connections in Borneo.',
    characteristics:['Long narrow hull','River transport','Multiple passengers']
  },


  // ============================================================
  // STORIES & FOLKLORE — 6
  // ============================================================

  {
    id:'sang-kancil',
    slug:'sang-kancil',
    name:'Sang Kancil',
    category:'Stories & Folklore',
    image:'/images/archive/sang-kancil.jpg',
    shortDescription:'A clever mousedeer character appearing in well-known Malay animal tales.',
    overview:'Sang Kancil stories often place the small mousedeer against larger animals and use cleverness rather than strength to overcome challenges.',
    origin:'Malay oral and literary tradition.',
    culturalSignificance:'Generations of children encounter Sang Kancil through storytelling, books, television and classroom materials.',
    characteristics:['Mousedeer character','Trickster stories','Lessons and humour']
  },

  {
    id:'mahsuri',
    slug:'mahsuri',
    name:'Mahsuri',
    category:'Stories & Folklore',
    image:'/images/archive/mahsuri.jpg',
    shortDescription:'The central figure in one of Langkawi’s best-known legends.',
    overview:'The legend tells of Mahsuri, a woman accused of wrongdoing and unjustly punished, followed by a curse said to have affected Langkawi.',
    origin:'Langkawi, Kedah, Malaysia.',
    culturalSignificance:'The story has become deeply connected with Langkawi’s cultural identity and tourism narratives.',
    characteristics:['Langkawi legend','Tragic narrative','Oral storytelling tradition']
  },

  {
    id:'puteri-gunung-ledang',
    slug:'puteri-gunung-ledang',
    name:'Puteri Gunung Ledang',
    category:'Stories & Folklore',
    image:'/images/archive/puteri-gunung-ledang.jpg',
    shortDescription:'A legendary princess associated with Gunung Ledang and the Melaka Sultanate tradition.',
    overview:'Versions of the story describe a ruler seeking to marry the princess, who responds with a series of extraordinary conditions.',
    origin:'Malay literary and oral traditions associated with Melaka and Johor.',
    culturalSignificance:'The legend has inspired literature, theatre, film and continuing discussion about Malay history and storytelling.',
    characteristics:['Legendary princess','Gunung Ledang setting','Extraordinary marriage conditions']
  },

  {
    id:'hang-tuah',
    slug:'hang-tuah',
    name:'Hang Tuah',
    category:'Stories & Folklore',
    image:'/images/archive/hang-tuah.jpg',
    shortDescription:'A famous warrior figure in Malay literary and historical tradition.',
    overview:'Hang Tuah appears prominently in works such as Hikayat Hang Tuah and traditions concerning the Melaka Sultanate. Historical interpretations of the figure vary.',
    origin:'Malay literary traditions associated particularly with Melaka.',
    culturalSignificance:'Stories surrounding Hang Tuah have shaped discussions about loyalty, friendship, leadership and Malay identity.',
    characteristics:['Warrior figure','Melaka tradition','Literary hero']
  },

  {
    id:'batu-belah-batu-bertangkup',
    slug:'batu-belah-batu-bertangkup',
    name:'Batu Belah Batu Bertangkup',
    category:'Stories & Folklore',
    image:'/images/archive/batu-belah-batu-bertangkup.jpg',
    shortDescription:'A well-known Malay folktale centred on family conflict and a mysterious rock.',
    overview:'Different versions tell of a mother who, after becoming deeply upset, approaches a supernatural rock said to open and close.',
    origin:'Malay folklore.',
    culturalSignificance:'The story has been retold through oral storytelling, books and screen adaptations and often raises themes of family and regret.',
    characteristics:['Folktale','Supernatural stone','Family themes']
  },

  {
    id:'bawang-putih-bawang-merah',
    slug:'bawang-putih-bawang-merah',
    name:'Bawang Putih Bawang Merah',
    category:'Stories & Folklore',
    image:'/images/archive/bawang-putih-bawang-merah.jpg',
    shortDescription:'A traditional tale about two young women, family conflict and contrasting behaviour.',
    overview:'Versions of the story differ, but commonly explore jealousy, hardship, kindness and consequences within a family.',
    origin:'Shared folk tradition within the Malay-Indonesian cultural region.',
    culturalSignificance:'The story has been repeatedly adapted into books, films and popular storytelling across the region.',
    characteristics:['Family story','Moral themes','Multiple regional versions']
  },


  // ============================================================
  // OTHER — 6
  // ============================================================

  {
    id:'mak-yong',
    slug:'mak-yong',
    name:'Mak Yong',
    category:'Other',
    image:'/images/archive/mak-yong.jpg',
    shortDescription:'A traditional theatre form combining acting, music, dance and storytelling.',
    overview:'Mak Yong performances integrate dialogue, stylised movement, music and dramatic stories performed by a specialised ensemble.',
    origin:'Strongly associated with Kelantan and the northern Malay Peninsula.',
    culturalSignificance:'Mak Yong represents a complex performance tradition in which music, oral storytelling, acting and movement come together.',
    characteristics:['Theatre','Dance','Music','Oral storytelling']
  },

  {
    id:'wayang-kulit-kelantan',
    slug:'wayang-kulit-kelantan',
    name:'Wayang Kulit Kelantan',
    category:'Other',
    image:'/images/archive/wayang-kulit-kelantan.jpg',
    shortDescription:'A shadow-puppet theatre tradition associated with Kelantan.',
    overview:'Flat puppets are manipulated behind a lit screen while a puppeteer performs dialogue and narration accompanied by musicians.',
    origin:'Kelantan, Malaysia, within a wider Southeast Asian shadow-puppet tradition.',
    culturalSignificance:'The art brings together carving, music, voice performance, storytelling and visual theatre.',
    characteristics:['Shadow puppets','Backlit screen','Live narration and music']
  },

  {
    id:'silat-melayu',
    slug:'silat-melayu',
    name:'Silat Melayu',
    category:'Other',
    image:'/images/archive/silat-melayu.jpg',
    shortDescription:'A martial arts tradition practised in Malaysia and the wider Malay world.',
    overview:'Silat includes systems of physical movement, defence, structured training and ceremonial practices that vary between schools and communities.',
    origin:'Malay world, including Malaysia.',
    culturalSignificance:'Silat combines physical practice with traditions of discipline, performance, teaching and community identity.',
    characteristics:['Martial art','Structured movements','Teacher-student tradition']
  },

  {
    id:'dondang-sayang',
    slug:'dondang-sayang',
    name:'Dondang Sayang',
    category:'Other',
    image:'/images/archive/dondang-sayang.jpg',
    shortDescription:'A traditional musical and poetic performance associated particularly with Melaka.',
    overview:'Performers exchange improvised or semi-improvised verses, often using pantun, accompanied by musical instruments.',
    origin:'Melaka and surrounding communities in Malaysia.',
    culturalSignificance:'The tradition encourages verbal creativity, musical skill and friendly interaction between performers.',
    characteristics:['Singing','Pantun exchange','Instrumental accompaniment']
  },

  {
    id:'pantun',
    slug:'pantun',
    name:'Pantun',
    category:'Other',
    image:'/images/archive/pantun.jpg',
    shortDescription:'A structured poetic form deeply rooted in Malay oral and literary tradition.',
    overview:'Pantun commonly use four lines with patterned rhyme and a relationship between an opening image and the meaning developed in later lines.',
    origin:'Malay world, including Malaysia.',
    culturalSignificance:'Pantun are used in conversation, ceremony, music, storytelling and literature and reward creativity with language.',
    characteristics:['Poetic form','Rhyming structure','Oral and written tradition']
  },

  {
    id:'main-puteri',
    slug:'main-puteri',
    name:'Main Puteri',
    category:'Other',
    image:'/images/archive/main-puteri.jpg',
    shortDescription:'A traditional Kelantanese performance tradition combining music, dialogue and ritual elements.',
    overview:'Main Puteri historically involved specialised performers, musicians, dialogue and sung passages within a traditional healing context.',
    origin:'Kelantan, Malaysia.',
    culturalSignificance:'The tradition provides insight into older relationships between performance, community belief, music and healing practices.',
    characteristics:['Traditional performance','Music','Dialogue','Ritual heritage']
  }

];
