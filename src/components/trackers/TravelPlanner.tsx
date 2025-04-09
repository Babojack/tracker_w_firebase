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
  Link as LinkIcon,
  DollarSign,
  Calendar,
  CheckCircle,
  Trash2,
  Edit3,
  Archive,
  Box,
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

interface FileAttachment {
  id: string;
  name: string;
  url: string;
}

interface TravelTrip {
  id: string;
  from: string;
  to: string;
  departureDate: string;
  returnDate: string;
  transport: string;
  ticketCost: string;
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

interface CityImageResponse {
  imageUrl: string;
  downloadLocation: string;
  photographerName: string;
  photographerProfile: string;
}

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_KEY;
;

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
    <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl p-4 shadow-xl flex items-center justify-center space-x-8">
      {/* From City */}
      <div className="flex flex-col items-center">
        {fromImg ? (
          <>
            <img
              src={fromImg.imageUrl}
              alt={from}
              className="w-20 h-20 rounded-full object-cover cursor-pointer transition-transform transform hover:scale-105 shadow-md"
              onClick={() => triggerDownload(fromImg.downloadLocation)}
            />
            <small className="text-white text-center mt-1">
              <a
                href={fromImg.photographerProfile}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerDownload(fromImg.downloadLocation)}
                className="underline"
              >
                {fromImg.photographerName}
              </a>
              , Unsplash
            </small>
          </>
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-400 opacity-50" />
        )}
        <span className="text-white mt-1 font-bold">{from}</span>
      </div>

      {/* Center - Dashed line & Transport Icon */}
      <div className="flex flex-col items-center">
        <svg width="100" height="20" viewBox="0 0 100 20">
          <line
            x1="0"
            y1="10"
            x2="100"
            y2="10"
            stroke="white"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        </svg>
        {getTransportIcon() && (
          <div className="mt-2 p-2 bg-gray-800 rounded-full shadow">
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
              className="w-20 h-20 rounded-full object-cover cursor-pointer transition-transform transform hover:scale-105 shadow-md"
              onClick={() => triggerDownload(toImg.downloadLocation)}
            />
            <small className="text-white text-center mt-1">
              <a
                href={toImg.photographerProfile}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerDownload(toImg.downloadLocation)}
                className="underline"
              >
                {toImg.photographerName}
              </a>
              , Unsplash
            </small>
          </>
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-400 opacity-50" />
        )}
        <span className="text-white mt-1 font-bold">{to}</span>
      </div>
    </div>
  );
};

const TravelPlanner: React.FC = () => {
  const [trips, setTrips] = useState<TravelTrip[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
          const newAttachment: FileAttachment = {
            id: Date.now().toString(),
            name: file.name,
            url: reader.result as string,
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
        const tripRef = doc(db, 'travelTrips', editingId);
        await updateDoc(tripRef, newTrip);
        setTrips(trips.map((t) => (t.id === editingId ? { id: editingId, ...newTrip } : t)));
      } else {
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

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 shadow-md"
        >
          <Plus size={18} /> New Trip
        </button>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow-md"
        >
          {showArchived ? 'Show Active' : 'Show Archived'}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-lg shadow-xl space-y-4 max-w-3xl mx-auto"
        >
          {(from || to) && <TripImagePreview from={from} to={to} transport={transport} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-white mb-1">From</label>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white mb-1">To</label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white mb-1">Departure Date</label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white mb-1">Return Date</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white mb-1">Transport</label>
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
              <label className="block text-sm font-bold text-white mb-1">Ticket Cost</label>
              <input
                type="text"
                value={ticketCost}
                onChange={(e) => setTicketCost(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
                placeholder="e.g., 200€"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white mb-1">Hotel Name</label>
              <input
                type="text"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white mb-1">Hotel Link</label>
              <input
                type="url"
                value={hotelLink}
                onChange={(e) => setHotelLink(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
                placeholder="https://"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white mb-1">Total Cost</label>
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
            <label className="block text-sm font-bold text-white mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-white mb-1">Upload File(s) (e.g., Tickets)</label>
            <input type="file" accept="*/*" onChange={handleFileUpload} className="w-full" />
            <div className="mt-2 space-y-1">
              {fileAttachments.map((file) => (
                <div key={file.id} className="flex items-center space-x-2">
                  <div className="flex-shrink-0">{/* Preview */}</div>
                  <span className="flex-shrink-0">
                    {/* File Preview logic or icon could go here */}
                  </span>
                  <input
                    type="text"
                    className="text-sm bg-transparent border-b border-dotted border-gray-500 focus:outline-none text-gray-300"
                    value={file.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFileAttachments((prev) =>
                        prev.map((f) => (f.id === file.id ? { ...f, name: newName } : f))
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded shadow"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-1 shadow"
            >
              <Save size={18} /> Save Trip
            </button>
          </div>
        </form>
      )}

      {/* Display Trips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trips
          .filter((trip) => (showArchived ? trip.archived : !trip.archived))
          .map((trip) => (
            <div
              key={trip.id}
              className="relative bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl shadow-2xl space-y-4"
            >
              {trip.completed && !trip.archived && (
                <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                  Completed
                </div>
              )}
              {trip.archived && (
                <div className="absolute top-3 right-3 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                  Archived
                </div>
              )}

              <TripImagePreview from={trip.from} to={trip.to} transport={trip.transport} />
              <div className="text-white space-y-1">
                <h3 className="text-2xl font-extrabold">
                  {trip.from} <span className="text-gray-300 text-xl">to</span> {trip.to}
                </h3>
                <p className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-blue-300" />
                  <span className="font-bold">Departure:</span>{' '}
                  {new Date(trip.departureDate).toLocaleDateString()}
                </p>
                {trip.returnDate && (
                  <p className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-blue-300" />
                    <span className="font-bold">Return:</span>{' '}
                    {new Date(trip.returnDate).toLocaleDateString()}
                  </p>
                )}
                {trip.transport && (
                  <p className="flex items-center text-sm">
                    <Box className="w-4 h-4 mr-2 text-blue-300" />
                    <span className="font-bold">Transport:</span> {trip.transport}
                  </p>
                )}
                {trip.ticketCost && (
                  <p className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 mr-2 text-blue-300" />
                    <span className="font-bold">Ticket Cost:</span> {trip.ticketCost}
                  </p>
                )}
                {trip.hotelName && (
                  <p className="flex items-center text-sm">
                    <Bed className="w-4 h-4 mr-2 text-blue-300" />
                    <span className="font-bold">Hotel:</span> {trip.hotelName}
                  </p>
                )}
                {trip.hotelLink && (
                  <a
                    href={trip.hotelLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-blue-400 underline"
                  >
                    <LinkIcon className="w-4 h-4 mr-1" />
                    <span className="font-bold">Hotel Link</span>
                  </a>
                )}
                {trip.totalCost && (
                  <p className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 mr-2 text-blue-300" />
                    <span className="font-bold">Total Cost:</span> {trip.totalCost}
                  </p>
                )}
                {trip.notes && (
                  <p className="text-sm">
                    <span className="font-bold">Notes:</span> {trip.notes}
                  </p>
                )}

                {/* Attachments */}
                {trip.files.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">Attachments:</p>
                    {trip.files.map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 mt-1"
                      >
                        {/* Could show a small preview or file icon */}
                        <span className="text-blue-300 underline text-xs">{file.name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-end gap-2 pt-4">
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
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                )}
                <button
                  onClick={() => deleteTrip(trip.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                {!trip.completed && !trip.archived && (
                  <button
                    onClick={() => markAsCompleted(trip.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Completed
                  </button>
                )}
                <button
                  onClick={() => toggleArchive(trip)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded flex items-center gap-1"
                >
                  <Archive className="w-4 h-4" />
                  {trip.archived ? 'Unarchive' : 'Archive'}
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default TravelPlanner;
