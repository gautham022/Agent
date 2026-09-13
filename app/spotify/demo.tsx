import { SpotifyCard } from "@/spotify/spotify-card";

export function Demo() {
  const songs = [
    {
      title: "Finding Her",
      artists: "Kushagra, Bharath, Saaheal",
      duration: 207,
      albumArt:
        "https://i.scdn.co/image/ab67616d00001e0283141000ee8ce3b893a0b425",
    },
    {
      title: "Daylight",
      artists: "David Kushner",
      duration: 226,
      albumArt:
        "https://i.scdn.co/image/ab67616d0000b273e40c514edddb844439af6201",
    },
    {
      title: "Heat Waves",
      artists: "Glass Animals",
      duration: 237,
      albumArt:
        "https://i.scdn.co/image/ab67616d0000b273712701c5e263efc8726b1464",
    },
    {
      title: "Perfect",
      artists: "Ed Sheeran",
      duration: 263,
      albumArt:
        "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
    },
  ];
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent text-white">
      <main className="w-screen h-screen flex justify-center items-center">
        <SpotifyCard songs={songs} />
      </main>
    </div>
  );
}

export default {
  Demo,
};
