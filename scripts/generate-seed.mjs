// Generates data/people.json — 25 SYNTHETIC demo personas (not real people).
// Replace linkedinUrl / instagramUrl / profile with real, verified data as needed.
import { writeFileSync } from "node:fs";

const SRC = { L: "LinkedIn", I: "Instagram", B: "Both" };
const BASE = { L: 0.72, I: 0.64, B: 0.86 };
const h = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const list = (name, str) =>
  str.split(",").map((t) => t.trim()).filter(Boolean).map((t) => {
    const [text, s = "B"] = t.split(":");
    const jitter = ((h(name + text) % 14) - 7) / 100;
    return { text, source: SRC[s], confidence: Math.round((BASE[s] + jitter) * 100) / 100 };
  });

// name | role | summary | interests | hobbies | values | topics | lifestyle | energizers | signals
const P = [
["Maya Chen","Product designer at a climate-tech startup","Product designer who appears to care about making sustainability tools feel human; weekends look outdoorsy.","design:L, climate:L, hiking:B, photography:I, coffee:I","hiking:I, photography:I, ceramics:I","curiosity:B, sustainability:B, kindness:I","trail recommendations, design critique, climate tech, film photography","early riser:I, outdoorsy weekends:I, specialty coffee:I","exploring new trails:I, shipping thoughtful design:L","values outdoor time, enjoys deep design talk"],
["Alex Rivera","Senior engineer at a fintech","Backend engineer who likes building reliable systems and, outside work, tends to be climbing or cooking.","startups:L, AI:L, climbing:I, cooking:I, music:I","climbing:I, cooking:I, vinyl records:I","ambition:L, honesty:B, learning:B","side projects, bouldering, recipes, distributed systems","active lifestyle:I, hosts dinners:I, late-night coding:L","solving hard problems:L, group climbs:I","enjoys active dates, likes curious builders"],
["Sarah Okafor","Growth lead at a consumer app","Growth marketer with a public interest in travel, food, and building communities around products.","startups:L, travel:B, food:I, community:L, writing:I","travel:I, food blogging:I, running:I","community:B, curiosity:B, ambition:L","street food, travel itineraries, growth experiments, running routes","frequent traveler:I, foodie:I, morning runs:I","meeting new people:B, trying new cuisines:I","social and energetic, enjoys shared adventures"],
["Daniel Kim","Data scientist at a healthcare analytics firm","Data scientist who writes about practical ML and appears to unwind with cycling and board games.","AI:L, data:L, cycling:I, gaming:I, books:I","cycling:I, board games:I, reading:I","learning:B, honesty:B, balance:I","practical machine learning, cycling routes, board games, sci-fi books","weekend rides:I, structured routines:L, game nights:I","clear data stories:L, long rides:I","likes thoughtful, analytical conversation"],
["Priya Nair","Founder of a small food-tech startup","Founder who seems to be deeply into food culture and building a mission-driven company.","startups:L, food:B, sustainability:L, cooking:I, travel:I","cooking:I, farmers markets:I, yoga:I","ambition:L, sustainability:B, community:I","food systems, founder life, cooking from scratch, travel eats","market mornings:I, hosts friends:I, yoga:I","building something meaningful:L, cooking for friends:I","mission-driven, enjoys cooking and hosting"],
["Jordan Ellis","UX researcher at an education company","UX researcher who likes understanding people; public posts suggest love of books and quiet coffee shops.","design:L, books:I, coffee:I, learning:L, writing:I","reading:I, journaling:I, coffee shop hopping:I","curiosity:B, kindness:B, learning:L","user interviews, book recommendations, coffee spots, education","bookstore visits:I, calm weekends:I, early mornings:I","listening to stories:L, good books:I","thoughtful listener, enjoys slow-paced dates"],
["Mateo Alvarez","Sales director at a SaaS company","Sales leader who appears outgoing, sports-minded, and social on weekends.","startups:L, fitness:I, music:I, travel:I, community:L","football:I, gym:I, live music:I","ambition:L, loyalty:I, honesty:B","live music, football, travel plans, team building","gym regular:I, social weekends:I, concert-goer:I","live events:I, closing a big deal:L","high-energy, likes lively plans"],
["Lena Fischer","Machine learning researcher","Researcher in applied AI who seems to enjoy mountains and quiet reading.","AI:L, data:L, hiking:I, books:I, climate:L","hiking:I, reading:I, skiing:I","curiosity:B, honesty:B, learning:B","AI research, mountain trips, long reads, climate modeling","weekend hikes:I, quiet evenings:I, structured days:L","deep focus work:L, mountain air:I","curious and grounded, enjoys the outdoors"],
["Omar Haddad","Architect at an urban design studio","Architect interested in cities and design, and who appears to travel for architecture and food.","design:L, travel:B, photography:I, food:I, art:I","photography:I, sketching:I, travel:I","creativity:B, curiosity:B, community:L","urban design, architecture travel, sketching, street photography","city wanderer:I, sketchbook in hand:I, foodie:I","walking new cities:I, design challenges:L","creative, loves exploring places"],
["Chloe Martin","Content creator and brand strategist","Creator who appears energetic, visual-first, and into fitness and fashion.","writing:L, fitness:I, art:I, travel:I, music:I","yoga:I, pilates:I, thrifting:I","creativity:B, kindness:I, ambition:L","brand storytelling, pilates, thrifting, travel content","wellness routines:I, social media savvy:B, early workouts:I","creating content:B, wellness time:I","expressive, enjoys creative and active plans"],
["Ravi Patel","Cloud infrastructure engineer","Infra engineer who likes tinkering; public photos suggest cricket, cooking, and gaming nights.","startups:L, AI:L, gaming:I, cooking:I, food:I","gaming:I, cricket:I, cooking:I","learning:L, loyalty:I, honesty:B","systems reliability, cricket, cooking, video games","game nights:I, home cook:I, structured routines:L","fixing tricky outages:L, cooking for friends:I","easygoing, enjoys low-key social time"],
["Emma Johansson","Sustainability consultant","Consultant focused on climate strategy; appears to spend free time cycling and outdoors.","climate:B, sustainability:B, cycling:I, hiking:I, travel:I","cycling:I, camping:I, gardening:I","sustainability:B, honesty:B, community:I","climate policy, bike touring, camping, gardening","car-free commuting:I, outdoor weekends:I, plant-based cooking:I","outdoor time:I, making climate progress:L","values-driven, enjoys active outdoor plans"],
["Noah Williams","Indie game developer","Solo game developer who seems creative and introverted, with interests in music and art.","gaming:B, design:L, music:I, art:I, startups:L","gaming:I, guitar:I, drawing:I","creativity:B, curiosity:B, balance:I","game design, indie music, pixel art, shipping solo projects","night owl:I, home studio:I, small gatherings:I","making things from scratch:L, jam sessions:I","creative, enjoys quieter settings"],
["Aisha Rahman","Public health researcher","Researcher focused on community programs; appears to enjoy running and volunteering.","community:B, learning:L, running:I, books:I, travel:I","running:I, volunteering:I, reading:I","kindness:B, community:B, honesty:I","community programs, half-marathon training, book clubs","morning runs:I, volunteers weekly:I, book club:I","helping communities:B, running events:I","warm and service-minded, enjoys active routines"],
["Lucas Bernard","Venture capital associate","Early-stage investor who appears curious about startups and into tennis and wine tasting.","startups:B, AI:L, travel:I, food:I, fitness:I","tennis:I, wine tasting:I, travel:I","ambition:L, curiosity:B, loyalty:I","startup trends, tennis, travel, restaurants","weekly tennis:I, dining out:I, frequent flyer:I","meeting founders:L, weekend tennis:I","sociable, likes good food and active plans"],
["Yuki Tanaka","Motion designer","Motion designer who seems inspired by film and animation, with a taste for ramen and city walks.","design:B, film:I, art:I, music:I, food:I","film watching:I, sketching:I, city walks:I","creativity:B, curiosity:B, kindness:I","animation, film recs, ramen spots, design tools","cinema nights:I, city walks:I, foodie:I","movie nights:I, creative briefs:L","playful and creative, enjoys cozy plans"],
["Grace Adeyemi","Nurse educator turned health-tech PM","Health-tech PM who appears caring and upbeat, into dance and yoga.","learning:L, community:L, fitness:I, music:I, food:I","dancing:I, yoga:I, cooking:I","kindness:B, community:B, balance:I","dance classes, wellness, healthy recipes, mentoring","weekly dance:I, wellness routines:I, mentors juniors:L","teaching and mentoring:L, dance floor:I","nurturing and lively, enjoys active dates"],
["Ethan Brooks","High-school teacher and writer","Teacher who writes on the side; public posts suggest love of books, running, and storytelling.","writing:B, books:B, learning:B, running:I, community:L","reading:I, running:I, writing:I","kindness:B, honesty:B, learning:B","book recs, running, storytelling, teaching tips","early runs:I, library visits:I, writes daily:I","a good story:B, mentoring students:L","reflective and kind, enjoys meaningful chats"],
["Sofia Rossi","Chef and restaurant owner","Chef who seems centered on food, seasonal cooking, and hosting.","food:B, cooking:B, travel:I, art:I, community:I","cooking:I, markets:I, wine:I","creativity:B, community:I, ambition:L","seasonal menus, travel eats, hosting, wine pairings","hosts dinners:I, market mornings:I, late nights:L","feeding people:B, discovering ingredients:I","warm host, loves food-led adventures"],
["Kabir Singh","Quant analyst","Quant who appears analytical; public posts hint at chess, running, and travel.","data:L, AI:L, running:I, books:I, travel:I","chess:I, running:I, reading:I","honesty:B, learning:B, ambition:L","markets, chess, running, travel","structured routines:L, morning runs:I, early nights:I","puzzles:B, running goals:I","analytical and focused, enjoys calm conversation"],
["Hannah Schmidt","Climate journalist","Journalist covering climate; seems into hiking, photography, and local food.","climate:B, writing:B, hiking:I, photography:I, sustainability:I","hiking:I, photography:I, farmers markets:I","honesty:B, curiosity:B, sustainability:B","climate stories, hikes, photo trips, local food","outdoor weekends:I, field trips:L, seasonal eating:I","telling important stories:L, trail days:I","curious and outdoorsy, enjoys meaningful talk"],
["Diego Morales","Fitness coach and gym founder","Gym founder with a strong fitness and community focus; appears social and motivational.","fitness:B, community:B, startups:L, food:I, music:I","weightlifting:I, running:I, cooking:I","ambition:L, community:B, loyalty:I","training, nutrition, small business, music","gym daily:I, meal prep:I, early riser:I","helping clients win:B, group workouts:I","motivating and sociable, enjoys active plans"],
["Zoe Campbell","PhD student in neuroscience","Grad student studying brain science; appears to enjoy climbing, baking, and podcasts.","learning:L, data:L, climbing:I, books:I, music:I","climbing:I, baking:I, podcasts:I","curiosity:B, honesty:B, balance:I","brain science, climbing gyms, baking, podcasts","climbing gym regular:I, baking weekends:I, busy weeks:L","a good experiment:L, bouldering sessions:I","curious and playful, enjoys active and cozy plans"],
["Tariq Ahmed","Startup CTO","CTO who appears to love building products and traveling to tech hubs; also plays football socially.","startups:B, AI:B, travel:I, fitness:I, music:I","football:I, travel:I, podcasts:I","ambition:B, learning:B, loyalty:I","AI products, hiring, football, travel","frequent traveler:I, weekend football:I, long work days:L","building teams:L, pickup games:I","driven and sociable, enjoys lively plans"],
["Isabel Cruz","Illustrator and art teacher","Illustrator who seems warm and imaginative; shares sketches, plants, and coffee shop visits.","art:B, design:I, books:I, coffee:I, community:L","drawing:I, gardening:I, coffee shop hopping:I","creativity:B, kindness:B, balance:I","illustration, plant care, coffee spots, teaching art","slow mornings:I, plant-filled home:I, teaches weekly:L","a blank sketchbook:I, teaching kids art:L","gentle and creative, enjoys slow-paced dates"],
];

const people = P.map(([name, role, summary, interests, hobbies, values, topics, lifestyle, energizers, signals], i) => {
  const slug = name.toLowerCase().replace(/[^a-z]+/g, "-");
  const cs = (s) => s.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (t.includes(":") ? t : t + ":B")).join(",");
  const pl = (s) => list(name, cs(s));
  return {
    id: slug,
    name,
    linkedinUrl: null,
    instagramUrl: null,
    avatar: null,
    demo: true,
    sourceText: `SYNTHETIC DEMO PERSONA — not a real person. Role: ${role}. No real public content was extracted.`,
    profile: {
      summary,
      summarySource: "Both",
      summaryConfidence: 0.78,
      interests: pl(interests),
      hobbies: pl(hobbies),
      values: pl(values),
      conversationTopics: pl(topics),
      lifestyleSignals: pl(lifestyle),
      energizers: pl(energizers),
      compatibilitySignals: pl(signals),
    },
    extraction: { status: "demo", notes: [`Role: ${role}`, "Fictional persona seeded for the demo. Replace with verified public links."] },
  };
});
writeFileSync(new URL("../data/people.json", import.meta.url), JSON.stringify(people, null, 2));
console.log(people.length, "people");
