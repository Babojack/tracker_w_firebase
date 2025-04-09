/// <reference types="vite/client" />
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import {
  Plus,
  Save,
  Plane,
  Train,
  Car,
  Bike,
  Bed,
  // Link as LinkIcon,  <-- Nicht mehr genutzt
  DollarSign,
  Calendar,
  CheckCircle,
  Trash2,
  Edit3,
  Archive,
  Box,
  FileText,
  X,
  Paperclip, // Für das Attachment-Icon
} from 'lucide-react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

/**
 * Erweiterte Datei-Anhang-Schnittstelle:
 * Wir lassen den Nutzer den Typ für die Anhänge (Tickets, Hotelreservierung, etc.) auswählen.
 */
interface FileAttachment {
  id: string;
  name: string;
  url: string;
  attachmentType: string;
}

interface TravelTrip {
  id: string;
  from: string;
  to: string;
  departureDate: string;
  returnDate: string;
  transport: string;
  ticketCost: string; // Wird im Formular erfasst, aber nicht (mehr) angezeigt
  hotelName: string;
  hotelLink: string;
  totalCost: string;
  notes: string;
  files: FileAttachment[];
  createdAt: number;
  userId: string;
  completed: boolean;
  archived: boolean;
}

/** Für das Laden von Unsplash-Bildern */
interface CityImageResponse {
  imageUrl: string;
  downloadLocation: string;
  photographerName: string;
  photographerProfile: string;
}

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_KEY;

// Unsplash-API-Aufruf
const fetchCityImage = async (city: string): Promise<CityImageResponse | null> => {
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(city)}&client_id=${UNSPLASH_ACCESS_KEY}`
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const photo = data.results[0];
      return {
        imageUrl: photo.urls.small,
        downloadLocation: photo.links.download_location,
        photographerName: photo.user.name,
        photographerProfile: photo.user.links.html,
      };
    }
  } catch (error) {
    console.error('Error fetching image for city', city, error);
  }
  return null;
};

const triggerDownload = (downloadUrl: string) => {
  fetch(downloadUrl).catch((err) => console.error('Error triggering download', err));
};

/**
 * Kleines Preview-Widget für die beiden Bilder (From / To) plus Transport-Icon
 */
interface TripImagePreviewProps {
  from: string;
  to: string;
  transport?: string;
}
const TripImagePreview: React.FC<TripImagePreviewProps> = ({ from, to, transport }) => {
  const [fromImg, setFromImg] = useState<CityImageResponse | null>(null);
  const [toImg, setToImg] = useState<CityImageResponse | null>(null);

  useEffect(() => {
    if (from) {
      fetchCityImage(from).then((res) => setFromImg(res));
    } else {
      setFromImg(null);
    }
  }, [from]);

  useEffect(() => {
    if (to) {
      fetchCityImage(to).then((res) => setToImg(res));
    } else {
      setToImg(null);
    }
  }, [to]);

  const getTransportIcon = () => {
    switch (transport) {
      case 'Airplane':
        return <Plane className="w-6 h-6 text-white" />;
      case 'Train':
        return <Train className="w-6 h-6 text-white" />;
      case 'Car':
        return <Car className="w-6 h-6 text-white" />;
      case 'Bicycle':
        return <Bike className="w-6 h-6 text-white" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center sm:justify-center gap-4 bg-slate-800 rounded-lg p-4 shadow">
      {/* From City */}
      <div className="flex flex-col items-center">
        {fromImg ? (
          <>
            <img
              src={fromImg.imageUrl}
              alt={from}
              className="w-20 h-20 rounded-full object-cover cursor-pointer transition-transform hover:scale-105 shadow-md"
              onClick={() => triggerDownload(fromImg.downloadLocation)}
            />
            <small className="text-gray-300 text-center mt-1 text-xs">
              <a
                href={fromImg.photographerProfile}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                onClick={() => triggerDownload(fromImg.downloadLocation)}
              >
                {fromImg.photographerName}
              </a>
              , Unsplash
            </small>
          </>
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-500 opacity-50" />
        )}
        <span className="text-gray-100 mt-1 font-semibold">{from}</span>
      </div>

      {/* Dotted line & Transport Icon */}
      <div className="flex flex-col items-center">
        <svg width="80" height="20" viewBox="0 0 100 20" className="hidden sm:block">
          <line
            x1="0"
            y1="10"
            x2="100"
            y2="10"
            stroke="white"
            strokeWidth="2"
            strokeDasharray="4,4"
          />
        </svg>
        {getTransportIcon() && (
          <div className="mt-2 bg-gray-700 rounded-full p-2 shadow hidden sm:block">
            {getTransportIcon()}
          </div>
        )}
      </div>

      {/* To City */}
      <div className="flex flex-col items-center">
        {toImg ? (
          <>
            <img
              src={toImg.imageUrl}
              alt={to}
              className="w-20 h-20 rounded-full object-cover cursor-pointer transition-transform hover:scale-105 shadow-md"
              onClick={() => triggerDownload(toImg.downloadLocation)}
            />
            <small className="text-gray-300 text-center mt-1 text-xs">
              <a
                href={toImg.photographerProfile}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                onClick={() => triggerDownload(toImg.downloadLocation)}
              >
                {toImg.photographerName}
              </a>
              , Unsplash
            </small>
          </>
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-500 opacity-50" />
        )}
        <span className="text-gray-100 mt-1 font-semibold">{to}</span>
      </div>
    </div>
  );
};

/**
 * Rendert eine Zeile mit Datum, Transport, Gesamtkosten, Notizen etc.
 */
const renderFeatureRow = (trip: TravelTrip) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center items-center py-2">
      {/* Abflugdatum */}
      {trip.departureDate && (
        <div className="flex items-center gap-1 text-sm text-gray-100">
          <Calendar className="w-4 h-4" />
          <span>{new Date(trip.departureDate).toLocaleDateString()}</span>
        </div>
      )}

      {/* Rückflugdatum */}
      {trip.returnDate && (
        <div className="flex items-center gap-1 text-sm text-gray-100">
          <Calendar className="w-4 h-4" />
          <span>{new Date(trip.returnDate).toLocaleDateString()}</span>
        </div>
      )}

      {/* Transport */}
      {trip.transport && (
        <div className="flex items-center gap-1 text-sm text-gray-100">
          {trip.transport === 'Airplane' && <Plane className="w-4 h-4" />}
          {trip.transport === 'Train' && <Train className="w-4 h-4" />}
          {trip.transport === 'Car' && <Car className="w-4 h-4" />}
          {trip.transport === 'Bicycle' && <Bike className="w-4 h-4" />}
          <span>{trip.transport}</span>
        </div>
      )}

      {/* Gesamtkosten */}
      {trip.totalCost && (
        <div className="flex items-center gap-1 text-sm text-gray-100">
          <DollarSign className="w-4 h-4" />
          <span>{trip.totalCost}</span>
        </div>
      )}

      {/* Notizen */}
      {trip.notes && (
        <div className="flex items-center gap-1 text-sm text-gray-100">
          <FileText className="w-4 h-4" />
          <span className="truncate max-w-[150px]">{trip.notes}</span>
        </div>
      )}
    </div>
  );
};

const TravelPlanner: React.FC = () => {
  const [trips, setTrips] = useState<TravelTrip[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Drawer-States
  const [openAttachmentTripId, setOpenAttachmentTripId] = useState<string | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  // Formular-Felder
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [transport, setTransport] = useState('');
  const [ticketCost, setTicketCost] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [hotelLink, setHotelLink] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [notes, setNotes] = useState('');
  const [fileAttachments, setFileAttachments] = useState<FileAttachment[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  // Trips laden
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const q = query(
          collection(db, 'travelTrips'),
          where('userId', '==', auth.currentUser?.uid || '')
        );
        const querySnapshot = await getDocs(q);
        const fetchedTrips: TravelTrip[] = [];
        querySnapshot.forEach((document) => {
          fetchedTrips.push({ id: document.id, ...document.data() } as TravelTrip);
        });
        setTrips(fetchedTrips);
      } catch (error) {
        console.error('Error fetching trips:', error);
      }
    };
    fetchTrips();
  }, []);

  const resetForm = () => {
    setFrom('');
    setTo('');
    setDepartureDate('');
    setReturnDate('');
    setTransport('');
    setTicketCost('');
    setHotelName('');
    setHotelLink('');
    setTotalCost('');
    setNotes('');
    setFileAttachments([]);
    setEditingId(null);
    setIsAdding(false);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (fileAttachments.length >= 5) {
      alert('You can only upload up to 5 files.');
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          // Standardmäßig "Tickets" als Attachment-Type
          const newAttachment: FileAttachment = {
            id: Date.now().toString(),
            name: file.name,
            url: reader.result as string,
            attachmentType: 'Tickets',
          };
          setFileAttachments((prev) => [...prev, newAttachment]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert('User is not logged in!');
      return;
    }
    const newTrip: Omit<TravelTrip, 'id'> = {
      from,
      to,
      departureDate,
      returnDate,
      transport,
      ticketCost,
      hotelName,
      hotelLink,
      totalCost,
      notes,
      files: fileAttachments,
      createdAt: Date.now(),
      userId: uid,
      completed: false,
      archived: false,
    };
    try {
      if (editingId) {
        // Update
        const tripRef = doc(db, 'travelTrips', editingId);
        await updateDoc(tripRef, newTrip);
        setTrips(trips.map((t) => (t.id === editingId ? { id: editingId, ...newTrip } : t)));
      } else {
        // Create
        const docRef = await addDoc(collection(db, 'travelTrips'), newTrip);
        setTrips([...trips, { id: docRef.id, ...newTrip }]);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const deleteTrip = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    try {
      await deleteDoc(doc(db, 'travelTrips', id));
      setTrips(trips.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error deleting trip:', error);
    }
  };

  const markAsCompleted = async (tripId: string) => {
    const tripRef = doc(db, 'travelTrips', tripId);
    await updateDoc(tripRef, { completed: true });
    setTrips(trips.map((t) => (t.id === tripId ? { ...t, completed: true } : t)));
  };

  const toggleArchive = async (trip: TravelTrip) => {
    const newArchived = !trip.archived;
    const tripRef = doc(db, 'travelTrips', trip.id);
    await updateDoc(tripRef, { archived: newArchived });
    setTrips(trips.map((t) => (t.id === trip.id ? { ...t, archived: newArchived } : t)));
  };

  // Drawer öffnen/schließen
  const handleOpenDrawer = (tripId: string) => {
    setOpenAttachmentTripId(tripId);
    setShowDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    // Warte auf die Transition, bevor wir den TripId zurücksetzen
    setTimeout(() => {
      setOpenAttachmentTripId(null);
    }, 300);
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-white">
      <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Steuer-Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-md"
            aria-label="New Trip"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-md"
            aria-label="Toggle Archived"
          >
            <Box size={18} />
          </button>
        </div>

        {/* Formular zum Hinzufügen/Bearbeiten */}
        {isAdding && (
          <form
            onSubmit={handleSubmit}
            className="bg-slate-800 p-6 rounded-lg shadow-xl space-y-4 max-w-3xl mx-auto"
          >
            {(from || to) && <TripImagePreview from={from} to={to} transport={transport} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1">From</label>
                <input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1">To</label>
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1">
                  Departure Date
                </label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1">Return Date</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1">Transport</label>
                <select
                  value={transport}
                  onChange={(e) => setTransport(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  required
                >
                  <option value="">Select Transport</option>
                  <option value="Car">Car</option>
                  <option value="Train">Train</option>
                  <option value="Airplane">Airplane</option>
                  <option value="Bicycle">Bicycle</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1">Ticket Cost</label>
                <input
                  type="text"
                  value={ticketCost}
                  onChange={(e) => setTicketCost(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  placeholder="e.g., 200€"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1">Hotel Name</label>
                <input
                  type="text"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1">Hotel Link</label>
                <input
                  type="url"
                  value={hotelLink}
                  onChange={(e) => setHotelLink(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  placeholder="https://"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1">Total Cost</label>
                <input
                  type="text"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  placeholder="e.g., 500€"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
                rows={3}
              />
            </div>
            {/* Datei-Uploads */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1">
                Upload File(s)
              </label>
              <input type="file" accept="*/*" onChange={handleFileUpload} className="w-full" />
              <div className="mt-2 space-y-2">
                {fileAttachments.map((file) => (
                  <div key={file.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="text-sm bg-transparent border-b border-dotted border-gray-500 focus:outline-none text-gray-300 flex-1"
                      value={file.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setFileAttachments((prev) =>
                          prev.map((f) => (f.id === file.id ? { ...f, name: newName } : f))
                        );
                      }}
                    />
                    <select
                      value={file.attachmentType}
                      onChange={(e) =>
                        setFileAttachments((prev) =>
                          prev.map((f) =>
                            f.id === file.id
                              ? { ...f, attachmentType: e.target.value }
                              : f
                          )
                        )
                      }
                      className="p-1 bg-gray-600 text-white rounded text-xs"
                    >
                      <option value="Tickets">Tickets</option>
                      <option value="Hotelreservierung">Hotelreservierung</option>
                      <option value="Sonstiges">Sonstiges</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
            {/* Action-Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full shadow"
                aria-label="Cancel"
              >
                <Trash2 size={18} />
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full flex items-center shadow"
                aria-label="Save Trip"
              >
                <Save size={18} />
              </button>
            </div>
          </form>
        )}

        {/* Anzeige der Trips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trips
            .filter((trip) => (showArchived ? trip.archived : !trip.archived))
            .map((trip) => (
              // Flex-Kolonne, damit die Buttons unten sitzen können
              <div
                key={trip.id}
                className="relative bg-slate-800 p-4 rounded-xl shadow-xl space-y-3 flex flex-col"
              >
                {/* Status-Badges */}
                {trip.completed && !trip.archived && (
                  <div className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-md">
                    Done
                  </div>
                )}
                {trip.archived && (
                  <div className="absolute top-3 right-3 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-md">
                    Archived
                  </div>
                )}

                {/* Trip-Bildvorschau */}
                <TripImagePreview from={trip.from} to={trip.to} transport={trip.transport} />

                {/* Feature-Chips (zentriert) */}
                {renderFeatureRow(trip)}

                {/* Attachments-Button, falls vorhanden */}
                {trip.files.length > 0 && (
                  <div className="flex justify-center mt-2">
                    <button
                      onClick={() => {
                        handleOpenDrawer(trip.id);
                      }}
                      className="flex items-center justify-center w-8 h-8 bg-gray-600 rounded-full text-white shadow-md"
                      aria-label="View Attachments"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Action Buttons: jetzt unten in der Mitte */}
                <div className="mt-auto flex justify-center gap-4 pt-2">
                  {!trip.archived && (
                    <button
                      onClick={() => {
                        setIsAdding(true);
                        setEditingId(trip.id);
                        setFrom(trip.from);
                        setTo(trip.to);
                        setDepartureDate(trip.departureDate.split('T')[0]);
                        setReturnDate(trip.returnDate.split('T')[0]);
                        setTransport(trip.transport);
                        setTicketCost(trip.ticketCost);
                        setHotelName(trip.hotelName);
                        setHotelLink(trip.hotelLink);
                        setTotalCost(trip.totalCost);
                        setNotes(trip.notes);
                        setFileAttachments(trip.files);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-md"
                      aria-label="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteTrip(trip.id)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-md"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {!trip.completed && !trip.archived && (
                    <button
                      onClick={() => markAsCompleted(trip.id)}
                      className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow-md"
                      aria-label="Mark as Completed"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => toggleArchive(trip)}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-md"
                    aria-label={trip.archived ? 'Unarchive' : 'Archive'}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Attachment-Drawer: dunkler Overlay + Drawer von rechts */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay zum Schließen */}
          <div
            className="flex-1 bg-black bg-opacity-50"
            onClick={handleCloseDrawer}
          />
          {/* Drawer */}
          <div className="relative w-80 h-full bg-white text-gray-800 p-4 transition-transform duration-300">
            <button
              onClick={handleCloseDrawer}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold mb-4">Attachments</h2>
            {openAttachmentTripId &&
              trips
                .find((t) => t.id === openAttachmentTripId)
                ?.files.map((file) => (
                  <div
                    key={file.id}
                    className="mb-3 border-b border-gray-200 pb-2 text-sm"
                  >
                    <p className="font-semibold">{file.attachmentType}</p>
                    <p className="text-gray-600">{file.name}</p>
                    {/* Download-Link für die Base64-Datei */}
                    <a
                      href={file.url}
                      download={file.name}
                      className="text-blue-600 hover:text-blue-900 underline block mt-1"
                    >
                      Download
                    </a>
                  </div>
                ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelPlanner;
