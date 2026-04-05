export const API_BASE_URL = 'http://localhost:5001/api';

export const COMMUNITY_FORM_FIELDS = {
  cricket: {
    uniqueFields: [
      {
        name: 'playingRole',
        label: 'Playing Role',
        type: 'dropdown',
        options: ['Batsman', 'Bowler', 'All-rounder', 'Wicket Keeper'],
      },
      {
        name: 'experienceLevel',
        label: 'Experience Level',
        type: 'dropdown',
        options: ['Beginner', 'Intermediate', 'Advanced'],
      },
      {
        name: 'ownEquipment',
        label: 'Do you own your own equipment?',
        type: 'radio',
        options: ['Yes', 'No'],
      },
    ],
  },
  hockey: {
    uniqueFields: [
      {
        name: 'playingPosition',
        label: 'Playing Position',
        type: 'dropdown',
        options: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'],
      },
      {
        name: 'experienceLevel',
        label: 'Experience Level',
        type: 'dropdown',
        options: ['Beginner', 'Intermediate', 'Advanced'],
      },
      {
        name: 'ownStick',
        label: 'Do you own your own stick?',
        type: 'radio',
        options: ['Yes', 'No'],
      },
    ],
  },
  environmental: {
    uniqueFields: [
      {
        name: 'areaOfInterest',
        label: 'Area of Interest',
        type: 'dropdown',
        options: [
          'Wildlife Conservation',
          'Waste Management',
          'Climate Awareness',
          'Tree Planting',
        ],
      },
      {
        name: 'volunteerExperience',
        label: 'Prior volunteer experience',
        type: 'textarea',
        placeholder: 'Describe your past volunteer work...',
      },
      {
        name: 'weekendAvailable',
        label: 'Are you available on weekends?',
        type: 'radio',
        options: ['Yes', 'No'],
      },
    ],
  },
  foc: {
    uniqueFields: [
      {
        name: 'roleInterested',
        label: 'Role Interested In',
        type: 'dropdown',
        options: [
          'Event Planning',
          'Marketing & Design',
          'Photography',
          'Logistics',
          'MC & Hosting',
        ],
      },
      {
        name: 'eventExperience',
        label: 'Event experience',
        type: 'textarea',
        placeholder: 'Tell us about your event experience...',
      },
      {
        name: 'softwareSkills',
        label: 'Software skills (e.g. Canva, Photoshop)',
        type: 'text',
        placeholder: 'List your software skills...',
      },
    ],
  },
  food: {
    uniqueFields: [
      {
        name: 'cookingExperience',
        label: 'Cooking Experience',
        type: 'dropdown',
        options: ['No experience', 'Home cook', 'Professionally trained'],
      },
      {
        name: 'cuisineInterest',
        label: 'Cuisine Interest',
        type: 'dropdown',
        options: ['Local', 'Continental', 'Baking & Pastry', 'All'],
      },
      {
        name: 'dietaryPreference',
        label: 'Dietary Preference',
        type: 'dropdown',
        options: ['None', 'Vegetarian', 'Vegan'],
      },
    ],
  },
};

export const COMMUNITIES_DATA = {
  cricket: {
    id: "cricket",
    name: "Cricket Club",
    logo: "/Image-communities/logo01.png",
    bgImage: "/Image-communities/Community01.jpg",
    founded: 2002,
    tagline: "Spirit of the Gentleman's Game",
    description: "The Cricket Club at our university is more than just a sports team; it is a community built on the pillars of discipline, teamwork, and an unwavering passion for the gentleman’s game. Unleash your inner athlete and be part of a squad that plays with heart and determination in every match, from local friendlies to intense inter-university tournaments.Whether you are a beginner picking up a bat for the first time or a seasoned player looking to refine your yorkers and cover drives, this is your premier platform to grow, compete, and create unforgettable moments on the field. We provide structured training sessions, access to quality gear, and a supportive environment where leadership and sportsmanship are cultivated. Beyond the boundaries, you will find a brotherhood of students dedicated to excellence. Join us today to represent our faculty, sharpen your skills, and leave a lasting legacy in the university's sporting history.",
    events: [
      { title: "Inter-University Cricket Tournament", date: "2026-04-12", location: "SLIIT Main Ground", image: "/Image-communities/CricketEvent1.jpg" },
      { title: "T20 Night Blast", date: "2026-04-20", location: "Colombo Cricket Club", image: "/Image-communities/CricketEvent2.jpg" },
      { title: "Freshers Cricket Trials", date: "2026-05-03", location: "SLIIT Ground B", image: "/Image-communities/CricketEvent3.jpg" },
      { title: "Cricket Awards Night", date: "2026-06-15", location: "SLIIT Auditorium", image: "/Image-communities/CricketEvent4.jpg" },
    ],
    notices: [
      { title: "Practice Session", body: "Practice session scheduled for Friday at 4:00 PM." },
      { title: "Tournament Open", body: "Inter-university tournament registrations are now open." },
      { title: "Player Selections", body: "New player selections will be held next week." },
      { title: "Indoor Nets", body: "Training sessions shifted to indoor nets due to weather." },
      { title: "Team Meeting", body: "Team meeting scheduled on Monday. Attendance mandatory." },
      { title: "Jersey Distribution", body: "Match jerseys distribution this Wednesday at sports office." }
    ]
  },
  hockey: {
    id: "hockey",
    name: "Hockey Club",
    logo: "/Image-communities/logo02.png",
    bgImage: "/Image-communities/Community02.jpg",
    founded: 2005,
    tagline: "Strength on the Field",
    description: "The Hockey Club at our university stands as a proud symbol of athletic excellence, unity, and the relentless pursuit of victory on the turf. Whether you are a seasoned striker with years of competitive experience or a passionate newcomer eager to learn the fundamentals of the game, this is the community where your journey begins. We train together, compete together, and grow together through structured coaching sessions, friendly fixtures, and high-stakes inter-university tournaments that test your skill and mental strength. Our club nurtures not just talented players but well-rounded individuals who understand the value of strategy, stamina, and solidarity. With access to quality equipment, expert guidance, and a deeply supportive team culture, every member is empowered to reach their personal best. Step onto the field with us and discover what it truly means to be part of something bigger than yourself. Join the Hockey Club and leave your mark on university sports history.",
    events: [
      { title: "Inter-University Hockey Championship", date: "2026-04-18", location: "SLIIT Hockey Ground", image: "/Image-communities/HockeyEvent1.jpg" },
      { title: "Friendly Match vs Moratuwa", date: "2026-05-02", location: "University of Moratuwa", image: "/Image-communities/HockeyEvent2.jpg" },
      { title: "Hockey Fitness Camp", date: "2026-05-10", location: "SLIIT Sports Complex", image: "/Image-communities/HockeyEvent3.jpg" },
      { title: "Hockey Awards Ceremony", date: "2026-06-20", location: "SLIIT Auditorium", image: "/Image-communities/HockeyEvent4.jpg" },
    ],
    notices: [
      { title: "Weekly Practice", body: "Weekly practice on Thursday at 5:00 PM." },
      { title: "Friendly Match", body: "Friendly match with neighboring university this weekend." },
      { title: "New Equipment", body: "New equipment has arrived. Collect during practice." },
      { title: "Fitness Assessment", body: "Player fitness assessments next week (Compulsory)." },
      { title: "Tournament Lineup", body: "Team lineup for upcoming tournament announced Friday." },
      { title: "Ground Change", body: "Training ground shifted temporarily. Check notice board." }
    ]
  },
  environmental: {
    id: "environmental",
    name: "Environmental Community",
    logo: "/Image-communities/logo03.png",
    bgImage: "/Image-communities/Community03.jpg",
    founded: 2015,
    tagline: "Green Today, Better Tomorrow",
    description: "The Environmental Community at our university is a passionate collective of change-makers, nature lovers, and sustainability advocates who believe that every small action contributes to a greater global impact. We are driven by the urgent need to protect our planet and inspire those around us to adopt greener, more conscious lifestyles within the campus and beyond. From organizing large-scale tree planting drives and waste management campaigns to conducting awareness workshops and leading coastal cleanup initiatives, our members are always at the forefront of meaningful environmental action. Whether you have a background in environmental science or simply carry a deep love for nature and a desire to make a difference, this community welcomes you with open arms. Together we design projects, build networks with like-minded individuals, and collaborate with university administration to create lasting sustainable change. Join us and become part of a movement that goes beyond academics to shape a healthier, greener future for generations to come.",
    events: [
      { title: "Campus Beach Clean-Up Drive", date: "2026-04-14", location: "Mount Lavinia Beach", image: "/Image-communities/EnvironmentalEvent1.jpg" },
      { title: "Sustainability Awareness Week", date: "2026-04-22", location: "SLIIT Main Hall", image: "/Image-communities/EnvironmentalEvent2.jpg" },
      { title: "Tree Planting Campaign", date: "2026-05-05", location: "SLIIT Campus Garden", image: "/Image-communities/EnvironmentalEvent3.jpg" },
      { title: "Eco-Innovation Challenge", date: "2026-06-01", location: "SLIIT Auditorium", image: "/Image-communities/EnvironmentalEvent4.jpg" },
    ],
    notices: [
      { title: "Beach Clean-Up", body: "Beach clean-up campaign scheduled for Saturday morning." },
      { title: "Sustainability Workshop", body: "Awareness workshop on sustainability held next week." },
      { title: "Tree Planting", body: "Tree planting program on campus this Friday." },
      { title: "Monthly Meeting", body: "Monthly meeting to discuss upcoming green projects." },
      { title: "Volunteers Needed", body: "Volunteers needed for the recycling initiative." },
      { title: "Awareness Week", body: "Environmental awareness week activities begin Monday." }
    ]
  },
  foc: {
    id: "foc",
    name: "FOC Event Club",
    logo: "/Image-communities/logo04.png",
    bgImage: "/Image-communities/Community04.jpg",
    founded: 2012,
    tagline: "Creating Unforgettable Experiences",
    description: "The FOC Event Club is the creative powerhouse behind some of the most exciting, memorable, and impactful events held within the Faculty of Computing at our university. We are a dynamic team of enthusiastic planners, creative designers, skilled photographers, and natural-born leaders who come together to transform ideas into extraordinary experiences. From large-scale faculty ceremonies and inter-department competitions to themed social nights and professional networking sessions, our club handles every detail with precision, creativity, and passion. Whether your strength lies in event logistics, digital marketing, stage management, content creation, or public speaking, there is a meaningful role waiting for you within our team. We believe that great events do not happen by accident; they are built by dedicated individuals who care deeply about the experience they create for others. Joining the FOC Event Club means developing real-world skills, building lasting friendships, and making your mark on the faculty's legacy. Come be part of the team that makes it all happen.",
    events: [
      { title: "Annual Freshers Welcome Night", date: "2026-04-10", location: "SLIIT Auditorium", image: "/Image-communities/FOCEvent1.jpg" },
      { title: "Tech Expo 2026", date: "2026-05-08", location: "SLIIT Main Hall", image: "/Image-communities/FOCEvent2.jpg" },
      { title: "Cultural Evening", date: "2026-05-22", location: "SLIIT Grounds", image: "/Image-communities/FOCEvent3.jpg" },
      { title: "FOC Talent Show", date: "2026-06-12", location: "SLIIT Auditorium", image: "/Image-communities/FOCEvent4.jpg" },
    ],
    notices: [
      { title: "Planning Meeting", body: "Planning meeting for upcoming tech event tomorrow." },
      { title: "Volunteers Required", body: "Volunteers required for event coordination." },
      { title: "Event Schedule", body: "Event schedule finalized and shared via official channels." },
      { title: "Mandatory Briefing", body: "Mandatory briefing session before the main event." },
      { title: "Feedback Session", body: "Feedback session for the last event this Friday." },
      { title: "New Proposals", body: "New event proposals open. Submit before deadline." }
    ]
  },
  food: {
    id: "food",
    name: "Food & Beverages Community",
    logo: "/Image-communities/logo05.png",
    bgImage: "/Image-communities/Community05.jpg",
    founded: 2018,
    tagline: "Taste. Share. Celebrate.",
    description: "The Food and Beverages Community at our university is a vibrant and welcoming space for students who share a deep love for culinary arts, food culture, and the joy of bringing people together through the universal language of great food. Whether you are an adventurous home cook eager to experiment with bold flavors, a passionate baker who finds comfort in the art of pastry, or simply someone who appreciates the beauty of a well-crafted meal and the stories behind it, this community is your home. We host exciting tasting sessions, collaborative cooking events, cultural food showcases, and recipe exchange workshops that celebrate the incredible diversity of cuisines from around the world. Beyond the kitchen, we explore food sustainability, nutrition awareness, and the cultural significance of traditional dishes. Members gain hands-on experience, build meaningful friendships, and develop a deeper appreciation for the craft of cooking. Join us and discover how food has the power to connect people, spark creativity, and create truly unforgettable shared experiences on campus.",
    events: [
      { title: "International Food Festival", date: "2026-04-16", location: "SLIIT Canteen Area", image: "/Image-communities/FoodEvent1.jpg" },
      { title: "MasterChef SLIIT Edition", date: "2026-05-01", location: "SLIIT Mini Auditorium", image: "/Image-communities/FoodEvent2.jpg" },
      { title: "Bake Sale for Charity", date: "2026-05-18", location: "SLIIT Front Lobby", image: "/Image-communities/FoodEvent3.jpg" },
      { title: "Beverage Tasting Night", date: "2026-06-08", location: "SLIIT Rooftop", image: "/Image-communities/FoodEvent4.jpg" },
    ],
    notices: [
      { title: "Festival Planning", body: "Food festival planning meeting scheduled for Tuesday." },
      { title: "Cooking Competition", body: "Registration for cooking competition now open." },
      { title: "Tasting Session", body: "Monthly tasting session held this Friday evening." },
      { title: "Stall Volunteers", body: "Volunteers needed for food stall coordination." },
      { title: "Safety Briefing", body: "Hygiene and safety briefing before the next event." },
      { title: "Menu Ideas", body: "New menu ideas welcome. Submit to organizing team." }
    ]
  }
};

export const CRICKET_CLUB = {
  name: 'Cricket Club',
  logo: '/assets/cricket-logo.png',
  description: 'Fostering sportsmanship and competitive cricket at university level since 2019.',
  adminId: 'admin_cricket_01',
  notices: [
    { id: 1, title: 'Practice rescheduled', content: 'This week practice moved to Friday 4pm.', date: '2026-03-21' },
    { id: 2, title: 'Tournament registration open', content: 'Register before March 30th.', date: '2026-03-20' },
  ],
  events: [
    { id: 1, title: 'Inter-university tournament', date: 'April 12, 2026', time: '9:00 AM', venue: 'Main Grounds' },
    { id: 2, title: 'Practice trials', date: 'April 5, 2026', time: '2:00 PM', venue: 'Ground B' },
  ]
}