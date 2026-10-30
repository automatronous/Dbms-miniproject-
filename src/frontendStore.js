const STORAGE_KEY = 'showtimeFrontendDataV1';
const DEMO_REVISION = 2;
const dunePoster = 'https://images.fandango.com/ImageRenderer/820/0/redesign/static/img/default_poster.png/0/images/masterrepository/fandango/234877/DUNE2_VERT_MAIN_2764x4096_DOM_REV.jpg';
const legacyPosterFixes = {
  'https://resizing.flixster.com/PgHhmCKS3hR6GUsVNlC-vZ9d90I%3D/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzLzZhOTA0OTIzLTEwNDctNDhkNS1iNTc3LTY3MjBmNDc5OGU1Mi5qcGc%3D': dunePoster,
  'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQ2CzjjVvJ.jpg': dunePoster,
  'https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQ2CzjjVvJ.jpg': dunePoster,
  'https://thumbnails.thecrimson.com/photos/2022/03/28/202438_1355231.jpg.1012x1500_q95_crop-smart_upscale.jpg': 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
  'https://image.tmdb.org/t/p/w500/jFt1gS4BGHlK8xt76Y81Alp4dbt.jpg': 'https://images.filmibeat.com/ph-big/2023/08/jawan_16914785234.jpg',
  'https://image.tmdb.org/t/p/w500/arf00BkwvXo0CFKbaD9OpqdE4Nu.jpg': 'https://images.filmibeat.com/ph-big/2022/12/pathaan_167090782630.jpg',
  'https://image.tmdb.org/t/p/w500/xG4D2b4RZ47a64QSw8g3z5wz0jV.jpg': 'https://assets.gadgets360cdn.com/pricee/assets/product/202205/dangal_poster_1652268388.jpg',
  'https://image.tmdb.org/t/p/w500/66A9MqXOyVFCssoloscw79z8Tew.jpg': 'https://images.vocus.cc/0ddfd1a5-95b5-4e7d-8bdc-096ba78f3f4d.jpg',
  'https://image.tmdb.org/t/p/w500/wE0I6efAW4cDDmZQWtwZMOW44EJ.jpg': 'https://m.media-amazon.com/images/M/MV5BODUwNDNjYzctODUxNy00ZTA2LWIyYTEtMDc5Y2E5ZjBmNTMzXkEyXkFqcGdeQXVyODE5NzE3OTE%40._V1_FMjpg_UX1000_.jpg',
};

const emptyStore = () => ({ movies: [], cinemas: [], screens: [], seats: [], shows: [], customers: [], bookings: [], payments: [] });

// Seeded demo records restore the original populated experience. They live in
// the browser store only and can be replaced by API/database records later.
const demoMovies = [
  { id: 1, title: 'Dune: Part Two', genre: 'Sci-Fi', language: 'English', duration: 166, release_date: '2024-03-01', rating: 8.6, description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.', poster: dunePoster },
  { id: 2, title: 'Oppenheimer', genre: 'Drama', language: 'English', duration: 180, release_date: '2023-07-21', rating: 8.3, description: 'The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.', poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg' },
  { id: 3, title: 'The Batman', genre: 'Action', language: 'English', duration: 176, release_date: '2022-03-04', rating: 7.8, description: 'Batman ventures into Gotham City’s underworld when a sadistic killer leaves behind a trail of cryptic clues.', poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg' },
  { id: 4, title: 'Barbie', genre: 'Comedy', language: 'English', duration: 114, release_date: '2023-07-21', rating: 7.0, description: 'Barbie leaves her seemingly perfect world and sets out to discover who she is beyond Barbie Land.', poster: 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg' },
  { id: 5, title: 'Spider-Man: Across the Spider-Verse', genre: 'Animation', language: 'English', duration: 140, release_date: '2023-06-02', rating: 8.6, description: 'Miles Morales swings into a multiverse-spanning adventure alongside a new team of Spider-People.', poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Ln5JxJ704m8.jpg' },
  { id: 6, title: 'Wonka', genre: 'Fantasy', language: 'English', duration: 116, release_date: '2023-12-15', rating: 7.1, description: 'A young Willy Wonka sets out to change the world one delicious invention at a time.', poster: 'https://image.tmdb.org/t/p/w500/qhb1qOilapbapxWQn9jRCMwXJF.jpg' },
  { id: 7, title: 'Jawan', genre: 'Action', language: 'Hindi', duration: 169, release_date: '2023-09-07', rating: 7.2, description: 'A vigilante recruits a group of women to expose corruption and deliver justice.', poster: 'https://images.filmibeat.com/ph-big/2023/08/jawan_16914785234.jpg' },
  { id: 8, title: 'Pathaan', genre: 'Action', language: 'Hindi', duration: 146, release_date: '2023-01-25', rating: 6.8, description: 'An exiled intelligence agent returns to stop a rogue operative threatening the country.', poster: 'https://images.filmibeat.com/ph-big/2022/12/pathaan_167090782630.jpg' },
  { id: 9, title: 'Dangal', genre: 'Drama', language: 'Hindi', duration: 161, release_date: '2016-12-23', rating: 8.3, description: 'A former wrestler trains his daughters to become champion wrestlers against the odds.', poster: 'https://assets.gadgets360cdn.com/pricee/assets/product/202205/dangal_poster_1652268388.jpg' },
  { id: 10, title: '3 Idiots', genre: 'Comedy', language: 'Hindi', duration: 171, release_date: '2009-12-25', rating: 8.4, description: 'Three friends find their own paths while challenging the pressure and expectations of college life.', poster: 'https://images.vocus.cc/0ddfd1a5-95b5-4e7d-8bdc-096ba78f3f4d.jpg' },
  { id: 11, title: 'RRR', genre: 'Action', language: 'Telugu', duration: 187, release_date: '2022-03-25', rating: 8.0, description: 'Two legendary revolutionaries forge an unlikely friendship in a sweeping tale of resistance.', poster: 'https://m.media-amazon.com/images/M/MV5BODUwNDNjYzctODUxNy00ZTA2LWIyYTEtMDc5Y2E5ZjBmNTMzXkEyXkFqcGdeQXVyODE5NzE3OTE%40._V1_FMjpg_UX1000_.jpg' },
];

function createDemoStore() {
  const cinemas = [
    { id: 1, name: 'PVR Icon', city: 'Mumbai', address: 'Phoenix Palladium, Lower Parel' },
    { id: 2, name: 'INOX Megaplex', city: 'Mumbai', address: 'R-City Mall, Ghatkopar' },
    { id: 3, name: 'Cinepolis', city: 'Pune', address: 'Seasons Mall, Hadapsar' },
  ];
  const screens = cinemas.flatMap(cinema => Array.from({ length: 3 }, (_, screenIndex) => ({ id: (cinema.id - 1) * 3 + screenIndex + 1, cinema_id: cinema.id, name: `Screen ${screenIndex + 1}`, type: 'Standard', capacity: 48, screen_width_m: 15.24, screen_height_m: 8.57, screen_bottom_m: 1.2, front_row_distance_m: 12, seat_pitch_m: 0.56, seat_width_m: 0.5, row_pitch_m: 1.35, row_rise_m: 0.22, eye_height_m: 1.12 })));
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const seats = screens.flatMap(screen => rows.flatMap((row_label, rowIndex) => Array.from({ length: 8 }, (_, index) => ({ id: screen.id * 1000 + rowIndex * 10 + index + 1, screen_id: screen.id, row_label, seat_number: index + 1, type: rowIndex >= 4 ? 'Premium' : 'Regular' }))));
  // Four daily slots on three screens are staggered to leave a realistic
  // cleaning/turnaround window after even the longest demo feature.
  const slots = ['10:00', '13:45', '17:30', '21:15'];
  const shows = [];
  let id = 1;
  for (let dayOffset = 0; dayOffset < 3; dayOffset += 1) {
    const moviesByCinema = cinemas.map((_, cinemaIndex) => demoMovies.filter((__, movieIndex) => (movieIndex + dayOffset) % cinemas.length === cinemaIndex));
    slots.forEach((slot, slotIndex) => {
      screens.forEach((screen, screenIndex) => {
        const cinemaIndex = screen.cinema_id - 1;
        const lineup = moviesByCinema[cinemaIndex];
        const movie = lineup[(slotIndex + screenIndex) % lineup.length];
        const [hour, minute] = slot.split(':').map(Number);
        const startsAt = new Date();
        startsAt.setDate(startsAt.getDate() + dayOffset + 1);
        startsAt.setHours(hour, minute, 0, 0);
        const endsAt = new Date(startsAt.getTime() + (movie.duration + 20) * 60_000);
        shows.push({ id: id++, movie_id: movie.id, screen_id: screen.id, starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), price: 300 + cinemaIndex * 25, status: 'SCHEDULED' });
      });
    });
  }
  return { ...emptyStore(), _demoRevision: DEMO_REVISION, movies: demoMovies, cinemas, screens, seats, shows };
}

function migrateDemoSchedule(data) {
  if (Number(data._demoRevision || 0) >= DEMO_REVISION) return data;
  const demo = createDemoStore();
  const demoMovieIds = new Set(demoMovies.map(movie => movie.id));
  const bookedShowIds = new Set(data.bookings.map(booking => Number(booking.show_id)));
  // Keep any booked legacy show intact for its booking record. Replace only
  // the old generated fixtures with the richer, non-overlapping timetable.
  const legacyShows = data.shows.filter(show => bookedShowIds.has(Number(show.id)) || !demoMovieIds.has(Number(show.movie_id)) || Number(show.id) > demoMovies.length * 3);
  const occupied = legacyShows.filter(show => show.status !== 'CANCELLED').map(show => ({ screen_id: Number(show.screen_id), start: new Date(show.starts_at).getTime(), end: new Date(show.ends_at).getTime() }));
  const generated = demo.shows.filter(show => !occupied.some(item => item.screen_id === Number(show.screen_id) && item.start < new Date(show.ends_at).getTime() && item.end > new Date(show.starts_at).getTime()));
  const keepScreens = new Map(data.screens.map(screen => [Number(screen.id), screen]));
  for (const fixture of demo.screens) {
    const current = keepScreens.get(fixture.id);
    // Move only untouched seeded room geometry to realistic viewing distances;
    // preserve values an admin has already edited in the frontend.
    if (current && Number(current.front_row_distance_m) === 5.5 && Number(current.row_pitch_m) === 1.05 && Number(current.row_rise_m) === 0.24) {
      Object.assign(current, { front_row_distance_m: fixture.front_row_distance_m, row_pitch_m: fixture.row_pitch_m, row_rise_m: fixture.row_rise_m });
    }
    if (!current) data.screens.push(fixture);
  }
  const existingScreenIds = new Set(data.screens.map(screen => Number(screen.id)));
  data.screens.push(...demo.screens.filter(screen => !existingScreenIds.has(screen.id)));
  const existingSeatKeys = new Set(data.seats.map(seat => `${seat.screen_id}:${seat.row_label}:${seat.seat_number}`));
  data.seats.push(...demo.seats.filter(seat => !existingSeatKeys.has(`${seat.screen_id}:${seat.row_label}:${seat.seat_number}`)));
  const next = Math.max(0, ...legacyShows.map(show => Number(show.id) || 0));
  data.shows = [...legacyShows, ...generated.map((show, index) => ({ ...show, id: next + index + 1 }))];
  data._demoRevision = DEMO_REVISION;
  return data;
}

function readStore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const data = { ...emptyStore(), ...(saved && typeof saved === 'object' ? saved : {}) };
    // Existing installs received empty collections during the no-data preview.
    // Restore demo fixtures once so the full booking journey is usable again.
    if (!data.movies.length && !data.shows.length) {
      const demo = createDemoStore();
      const restored = { ...demo, ...data, movies: demo.movies, cinemas: demo.cinemas, screens: demo.screens, seats: demo.seats, shows: demo.shows };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
      return restored;
    }
    let postersRepaired = false;
    for (const movie of data.movies) {
      const repairedPoster = legacyPosterFixes[movie.poster];
      if (repairedPoster) { movie.poster = repairedPoster; postersRepaired = true; }
    }
    if (postersRepaired) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const migrated = migrateDemoSchedule(data);
    if (migrated !== data || Number(data._demoRevision || 0) !== DEMO_REVISION) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    const dune = data.movies.find(movie => movie.title === 'Dune: Part Two');
    if (dune?.poster === 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQ2CzjjVvJ.jpg') {
      dune.poster = demoMovies[0].poster;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    return data;
  } catch {
    return createDemoStore();
  }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event('showtime-data-change'));
}

function nextId(rows) {
  return Math.max(0, ...rows.map(row => Number(row.id) || 0)) + 1;
}

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function recordForShow(store, show) {
  if (!show) return null;
  const movie = store.movies.find(row => Number(row.id) === Number(show.movie_id)) || {};
  const screen = store.screens.find(row => Number(row.id) === Number(show.screen_id)) || {};
  const cinema = store.cinemas.find(row => Number(row.id) === Number(screen.cinema_id)) || {};
  return {
    ...show, movie: movie.title, genre: movie.genre, language: movie.language,
    duration: movie.duration, rating: movie.rating, poster: movie.poster,
    screen: screen.name, screen_type: screen.type, cinema: cinema.name,
    city: cinema.city, address: cinema.address,
    screen_width_m: screen.screen_width_m, screen_height_m: screen.screen_height_m,
    screen_bottom_m: screen.screen_bottom_m, front_row_distance_m: screen.front_row_distance_m,
    seat_pitch_m: screen.seat_pitch_m, seat_width_m: screen.seat_width_m,
    row_pitch_m: screen.row_pitch_m, row_rise_m: screen.row_rise_m,
    eye_height_m: screen.eye_height_m,
  };
}

function recordForBooking(store, booking) {
  const show = recordForShow(store, store.shows.find(row => Number(row.id) === Number(booking.show_id)));
  const customer = store.customers.find(row => Number(row.id) === Number(booking.customer_id)) || {};
  const seats = store.seats.filter(seat => (booking.seat_ids || []).includes(Number(seat.id)));
  const payment = store.payments.find(row => Number(row.booking_id) === Number(booking.id)) || {};
  return {
    ...show, ...booking, id: booking.id, customer: customer.name, email: customer.email, phone: customer.phone,
    seats: seats.map(seat => `${seat.row_label}${seat.seat_number}`).join(','),
    payment: payment.status || 'PENDING', poster: show?.poster || '',
  };
}

function currentAccount() {
  try { return JSON.parse(localStorage.getItem('showtimeDemoAccount') || 'null'); } catch { return null; }
}

function endpointData(store, pathname, search) {
  const query = new URLSearchParams(search);
  if (pathname === '/api/health') return { ok: true, mode: 'frontend-only' };
  if (pathname === '/api/movies') return store.movies;
  if (pathname.startsWith('/api/movies/')) return store.movies.find(row => Number(row.id) === Number(pathname.split('/').pop())) || fail('Movie not found.', 404);
  if (pathname === '/api/cinemas') return store.cinemas;
  if (pathname === '/api/screens') return store.screens.map(screen => ({ ...screen, cinema: store.cinemas.find(row => Number(row.id) === Number(screen.cinema_id))?.name || '' }));
  if (pathname === '/api/shows') return store.shows.filter(show => show.status !== 'CANCELLED' && (!query.has('movie') || Number(show.movie_id) === Number(query.get('movie')))).map(show => recordForShow(store, show)).filter(show => show.movie && show.cinema && show.screen).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  if (pathname.startsWith('/api/seats/')) {
    const screenId = Number(pathname.split('/').pop());
    const showId = Number(query.get('show'));
    const booked = new Set(store.bookings.filter(booking => Number(booking.show_id) === showId && booking.status !== 'CANCELLED').flatMap(booking => booking.seat_ids || []).map(Number));
    return store.seats.filter(seat => Number(seat.screen_id) === screenId).sort((a, b) => a.row_label.localeCompare(b.row_label) || Number(a.seat_number) - Number(b.seat_number)).map(seat => ({ ...seat, booked: booked.has(Number(seat.id)) ? 1 : 0 }));
  }
  if (pathname === '/api/seats') return store.seats.map(seat => {
    const screen = store.screens.find(row => Number(row.id) === Number(seat.screen_id)) || {};
    const cinema = store.cinemas.find(row => Number(row.id) === Number(screen.cinema_id)) || {};
    return { ...seat, screen: screen.name, cinema: cinema.name };
  });
  if (pathname === '/api/customers') return store.customers;
  if (pathname === '/api/payments') return store.payments.map(payment => ({ ...payment, booking: payment.booking_id, customer: store.customers.find(row => Number(row.id) === Number(store.bookings.find(booking => Number(booking.id) === Number(payment.booking_id))?.customer_id))?.name || '' }));
  if (pathname === '/api/bookings') {
    const account = currentAccount();
    const rows = account?.role === 'admin' || !account?.userId ? store.bookings : store.bookings.filter(booking => booking.user_id === account.userId);
    return rows.map(booking => recordForBooking(store, booking));
  }
  if (pathname.startsWith('/api/bookings/')) {
    const booking = store.bookings.find(row => Number(row.id) === Number(pathname.split('/').pop()));
    return booking ? recordForBooking(store, booking) : fail('Booking not found.', 404);
  }
  if (pathname === '/api/dashboard') {
    const now = Date.now();
    const start = query.get('start') || '';
    const end = query.get('end') || '';
    const paymentByBooking = new Map(store.payments.map(payment => [Number(payment.booking_id), payment]));
    const inRange = booking => {
      const day = String(paymentByBooking.get(Number(booking.id))?.paid_at || booking.created_at || '').slice(0, 10);
      return (!start || day >= start) && (!end || day <= end);
    };
    const rangedBookings = store.bookings.filter(inRange);
    const confirmed = rangedBookings.filter(booking => booking.status === 'CONFIRMED');
    const upcoming = store.shows.filter(show => show.status !== 'CANCELLED' && new Date(show.starts_at).getTime() >= now).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    const showById = new Map(store.shows.map(show => [Number(show.id), show]));
    const upcomingBookings = confirmed.filter(booking => new Date(showById.get(Number(booking.show_id))?.starts_at || 0).getTime() >= now);
    const capacity = upcoming.reduce((sum, show) => sum + store.seats.filter(seat => Number(seat.screen_id) === Number(show.screen_id)).length, 0);
    const reserved = upcomingBookings.reduce((sum, booking) => sum + (booking.seat_ids || []).length, 0);
    const successfulPayments = store.payments.filter(payment => payment.status === 'SUCCESS' && rangedBookings.some(booking => Number(booking.id) === Number(payment.booking_id)));
    const paidBookings = confirmed.filter(booking => paymentByBooking.get(Number(booking.id))?.status === 'SUCCESS');
    const revenueMovies = store.movies.map(movie => {
      const bookings = paidBookings.filter(booking => Number(showById.get(Number(booking.show_id))?.movie_id) === Number(movie.id));
      return { label: movie.title, value: bookings.reduce((sum, booking) => sum + Number(paymentByBooking.get(Number(booking.id))?.amount || 0), 0), bookings: bookings.length };
    }).sort((a, b) => b.value - a.value);
    const revenueCinemas = store.cinemas.map(cinema => {
      const screenIds = new Set(store.screens.filter(screen => Number(screen.cinema_id) === Number(cinema.id)).map(screen => Number(screen.id)));
      const bookings = paidBookings.filter(booking => screenIds.has(Number(showById.get(Number(booking.show_id))?.screen_id)));
      const tickets = bookings.reduce((sum, booking) => sum + (booking.seat_ids || []).length, 0);
      const upcomingCapacity = upcoming.filter(show => screenIds.has(Number(show.screen_id))).reduce((sum, show) => sum + store.seats.filter(seat => Number(seat.screen_id) === Number(show.screen_id)).length, 0);
      const upcomingTickets = upcomingBookings.filter(booking => screenIds.has(Number(showById.get(Number(booking.show_id))?.screen_id))).reduce((sum, booking) => sum + (booking.seat_ids || []).length, 0);
      return { name: cinema.name, city: cinema.city, bookings: bookings.length, tickets, revenue: bookings.reduce((sum, booking) => sum + Number(paymentByBooking.get(Number(booking.id))?.amount || 0), 0), occupancy: upcomingCapacity ? Math.round(upcomingTickets / upcomingCapacity * 100) : 0 };
    }).sort((a, b) => b.revenue - a.revenue);
    const statuses = ['CONFIRMED', 'CANCELLED', 'PENDING'].map(status => ({ label: status, value: rangedBookings.filter(booking => booking.status === status).length }));
    const paidRevenue = successfulPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const recent = [...rangedBookings].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 6).map(booking => recordForBooking(store, booking));
    return { movies: store.movies.length, cinemas: store.cinemas.length, theatres: store.cinemas.length, screens: store.screens.length, seats: store.seats.length, customers: store.customers.length, payments: store.payments.length, shows: upcoming.length, bookings: rangedBookings.length, revenue: paidRevenue, paidRevenue, confirmedBookings: confirmed.length, cancelledBookings: rangedBookings.filter(booking => booking.status === 'CANCELLED').length, ticketCount: confirmed.reduce((sum, booking) => sum + (booking.seat_ids || []).length, 0), paidTicketCount: paidBookings.reduce((sum, booking) => sum + (booking.seat_ids || []).length, 0), occupancy: capacity ? Math.round(reserved / capacity * 100) : 0, paymentSuccess: successfulPayments.length, paymentPending: store.payments.filter(payment => payment.status === 'PENDING' && rangedBookings.some(booking => Number(booking.id) === Number(payment.booking_id))).length, recent, nextShows: upcoming.slice(0, 6).map(show => recordForShow(store, show)), revenueMovies, revenueCinemas, statuses };
  }
  if (pathname === '/api/reports') {
    const start = query.get('start') || '';
    const end = query.get('end') || '';
    const paymentFor = booking => store.payments.find(payment => Number(payment.booking_id) === Number(booking.id));
    const inRange = booking => {
      const payment = paymentFor(booking);
      const paidAt = payment?.paid_at || booking.created_at || '';
      const day = String(paidAt).slice(0, 10);
      return booking.status === 'CONFIRMED' && payment?.status === 'SUCCESS' && (!start || day >= start) && (!end || day <= end);
    };
    const movies = store.movies.map(movie => {
      const bookings = store.bookings.filter(booking => Number(store.shows.find(show => Number(show.id) === Number(booking.show_id))?.movie_id) === Number(movie.id) && inRange(booking));
      return { title: movie.title, id: movie.id, payments: bookings.length, tickets: bookings.reduce((n, booking) => n + (booking.seat_ids || []).length, 0), revenue: bookings.reduce((n, booking) => n + Number(paymentFor(booking)?.amount || 0), 0) };
    });
    const cinemas = store.cinemas.filter(cinema => !query.get('city') || cinema.city === query.get('city')).map(cinema => {
      const screenIds = store.screens.filter(screen => Number(screen.cinema_id) === Number(cinema.id)).map(screen => Number(screen.id));
      const bookings = store.bookings.filter(booking => inRange(booking) && screenIds.includes(Number(store.shows.find(show => Number(show.id) === Number(booking.show_id))?.screen_id)));
      return { name: cinema.name, city: cinema.city, bookings: bookings.length, seats: bookings.reduce((n, booking) => n + (booking.seat_ids || []).length, 0), revenue: bookings.reduce((n, booking) => n + Number(paymentFor(booking)?.amount || 0), 0) };
    });
    return { movies, cinemas, cities: [...new Set(store.cinemas.map(cinema => cinema.city).filter(Boolean))] };
  }
  return undefined;
}

export async function request(url, options = {}) {
  const parsed = new URL(url, location.origin);
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  const store = readStore();
  if (method === 'GET') {
    const result = endpointData(store, parsed.pathname, parsed.search);
    return result === undefined ? fail('Unknown frontend data collection.', 404) : result;
  }

  const parts = parsed.pathname.split('/').filter(Boolean);
  const key = parts[1];
  const id = parts[2] ? Number(parts[2]) : null;
  const allowed = ['movies', 'cinemas', 'screens', 'seats', 'shows', 'customers'];
  if (key === 'bookings' && method === 'POST') {
    const show = store.shows.find(row => Number(row.id) === Number(body.show_id) && row.status !== 'CANCELLED');
    if (!show) return fail('This showtime is no longer available.', 409);
    const seatIds = [...new Set((body.seats || []).map(Number))];
    if (!seatIds.length) return fail('Select at least one seat.', 422);
    const screenSeats = store.seats.filter(seat => Number(seat.screen_id) === Number(show.screen_id));
    if (seatIds.some(seatId => !screenSeats.some(seat => Number(seat.id) === seatId))) return fail('A selected seat is not part of this screen.', 409);
    const booked = new Set(store.bookings.filter(booking => Number(booking.show_id) === Number(show.id) && booking.status === 'CONFIRMED').flatMap(booking => booking.seat_ids || []).map(Number));
    if (seatIds.some(seatId => booked.has(seatId))) return fail('A selected seat has already been booked.', 409);
    const fields = body.customer || {};
    let customer = store.customers.find(row => String(row.email).toLowerCase() === String(fields.email || '').toLowerCase());
    if (!customer) { customer = { id: nextId(store.customers), name: fields.name || '', email: fields.email || '', phone: fields.phone || '' }; store.customers.push(customer); }
    else Object.assign(customer, { name: fields.name || customer.name, phone: fields.phone || customer.phone });
    const id = nextId(store.bookings);
    const fare = body.fare || {};
    const booking = { id, customer_id: customer.id, user_id: currentAccount()?.userId || fields.email || '', show_id: show.id, seat_ids: seatIds, total: Number(fare.total ?? Number(show.price || 0) * seatIds.length), ticketSubtotal: Number(fare.ticketSubtotal ?? Number(show.price || 0) * seatIds.length), platformFee: Number(fare.platformFee || 0), gst: Number(fare.gst || 0), created_at: new Date().toISOString(), status: 'CONFIRMED' };
    store.bookings.push(booking);
    store.payments.push({ id: nextId(store.payments), booking_id: id, amount: booking.total, method: 'DEMO', status: 'SUCCESS', paid_at: new Date().toISOString() });
    writeStore(store);
    return { id, booking: recordForBooking(store, booking) };
  }
  if (key === 'bookings' && method === 'PUT') {
    const booking = store.bookings.find(row => Number(row.id) === id);
    if (!booking) return fail('Booking not found.', 404);
    if (booking.status !== 'CONFIRMED') return fail('Only confirmed bookings can be cancelled.', 409);
    booking.status = 'CANCELLED'; writeStore(store); return { ok: true };
  }
  if (key === 'bookings' && method === 'DELETE') {
    const index = store.bookings.findIndex(row => Number(row.id) === id);
    if (index < 0) return fail('Booking not found.', 404);
    store.bookings.splice(index, 1);
    store.payments = store.payments.filter(payment => Number(payment.booking_id) !== id);
    writeStore(store);
    return { ok: true };
  }
  if (key === 'payments' && method === 'DELETE') {
    const index = store.payments.findIndex(row => Number(row.id) === id);
    if (index < 0) return fail('Payment not found.', 404);
    store.payments.splice(index, 1);
    writeStore(store);
    return { ok: true };
  }
  if (!allowed.includes(key)) return fail('Unknown frontend data collection.', 404);
  const records = store[key];
  if (method === 'POST') {
    const record = { ...body, id: nextId(records) };
    if (key === 'shows') {
      if (new Date(record.ends_at) <= new Date(record.starts_at)) return fail('Show end time must be later than start time.', 422);
      const overlap = records.some(item => Number(item.screen_id) === Number(record.screen_id) && item.status !== 'CANCELLED' && new Date(item.starts_at) < new Date(record.ends_at) && new Date(item.ends_at) > new Date(record.starts_at));
      if (overlap) return fail('This screen already has a show scheduled in that time range.', 409);
    }
    records.push(record); writeStore(store); return { id: record.id };
  }
  if (method === 'PUT') {
    const record = records.find(item => Number(item.id) === id);
    if (!record) return fail('Record not found.', 404);
    Object.assign(record, body); writeStore(store); return { ok: true };
  }
  if (method === 'DELETE') {
    const index = records.findIndex(item => Number(item.id) === id);
    if (index < 0) return fail('Record not found.', 404);
    const inUse = key === 'movies' && store.shows.some(show => Number(show.movie_id) === id)
      || key === 'cinemas' && store.screens.some(screen => Number(screen.cinema_id) === id)
      || key === 'screens' && (store.seats.some(seat => Number(seat.screen_id) === id) || store.shows.some(show => Number(show.screen_id) === id))
      || key === 'shows' && store.bookings.some(booking => Number(booking.show_id) === id)
      || key === 'seats' && store.bookings.some(booking => (booking.seat_ids || []).map(Number).includes(id));
    if (inUse) return fail('This record is in use. Remove its dependent records first.', 409);
    records.splice(index, 1); writeStore(store); return { ok: true };
  }
  return fail('Unsupported frontend data operation.', 405);
}

export function resetFrontendData() {
  localStorage.removeItem(STORAGE_KEY);
}
