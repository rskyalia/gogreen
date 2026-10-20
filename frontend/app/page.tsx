import Navbar from "@/components/navbar";
import Hero from "@/components/sections/hero";
import Categories from "@/components/sections/categories";
import UserPosts from "@/components/sections/userposts";
import DiyCommunity from "@/components/sections/DIYCommunity";
import WasteBank from "@/components/sections/wasteBank";
import Gamification from "@/components/sections/gamification";
import Footer from "@/components/sections/footer";
import Contact from "@/components/sections/contact";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Categories />
        <UserPosts />
        <DiyCommunity />
        <WasteBank />
        <Gamification />
        <Contact />
        <Footer />
      </main>
    </>
  );
}