import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Plus, X, Save, Download, Upload } from 'lucide-react';
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
}

const TravelPlanner: React.FC = () => {
  // State for trip cards
  const [trips, setTrips] = useState<TravelTrip[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields for a trip
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

  // Helper function to render file preview thumbnails
  const renderFilePreview = (file: FileAttachment) => {
    if (file.url.startsWith('data:image')) {
      return (
        <img
          src={file.url}
          alt={file.name}
          className="w-16 h-16 object-cover rounded"
        />
      );
    } else if (file.url.startsWith('data:application/pdf')) {
      return (
        <div className="w-16 h-16 flex items-center justify-center bg-gray-700 rounded">
          <span className="text-xs">PDF</span>
        </div>
      );
    } else {
      return (
        <div className="w-16 h-16 flex items-center justify-center bg-gray-700 rounded">
          <span className="text-xs">File</span>
        </div>
      );
    }
  };

  // Fetch trips for the current user from Firestore
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const q = query(
          collection(db, 'travelTrips'),
          where('userId', '==', auth.currentUser?.uid || '')
        );
        const querySnapshot = await getDocs(q);
        const fetchedTrips: TravelTrip[] = [];
        querySnapshot.forEach(document => {
          fetchedTrips.push({ id: document.id, ...document.data() } as TravelTrip);
        });
        setTrips(fetchedTrips);
      } catch (error) {
        console.error("Error fetching trips:", error);
      }
    };

    fetchTrips();
  }, []);

  // Reset form fields
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

  // Handle file upload. Es wird geprüft, ob bereits 5 Dateien vorliegen.
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (fileAttachments.length >= 5) {
      alert("You can only upload up to 5 files.");
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const newAttachment: FileAttachment = {
            id: Date.now().toString(),
            name: file.name, // initial label is the file name
            url: reader.result as string,
          };
          setFileAttachments(prev => [...prev, newAttachment]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit the form to create or update a trip
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert("User is not logged in!");
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
    };

    try {
      if (editingId) {
        // Update an existing trip
        const tripRef = doc(db, 'travelTrips', editingId);
        await updateDoc(tripRef, newTrip);
        setTrips(trips.map(t => t.id === editingId ? { id: editingId, ...newTrip } : t));
      } else {
        // Create a new trip
        const docRef = await addDoc(collection(db, 'travelTrips'), newTrip);
        setTrips([...trips, { id: docRef.id, ...newTrip }]);
      }
      resetForm();
    } catch (error) {
      console.error("Error saving trip:", error);
    }
  };

  // Delete a trip card
  const deleteTrip = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'travelTrips', id));
      setTrips(trips.filter(t => t.id !== id));
    } catch (error) {
      console.error("Error deleting trip:", error);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">Travel Planner</h2>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus size={18} />  New Trip
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-gray-800 p-4 rounded space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">From</label>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Departure Date</label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Return Date</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Transport</label>
              <input
                type="text"
                value={transport}
                onChange={(e) => setTransport(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
                placeholder="Flight, Train, Car, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ticket Cost</label>
              <input
                type="text"
                value={ticketCost}
                onChange={(e) => setTicketCost(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
                placeholder="e.g., 200€"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hotel Name</label>
              <input
                type="text"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hotel Link</label>
              <input
                type="url"
                value={hotelLink}
                onChange={(e) => setHotelLink(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
                placeholder="https://"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Cost</label>
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
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Upload File(s) (e.g., Tickets)
            </label>
            <input
              type="file"
              accept="*/*"
              onChange={handleFileUpload}
              className="w-full"
            />
            <div className="mt-2 space-y-1">
              {fileAttachments.map(file => (
                <div key={file.id} className="flex items-center space-x-2">
                  {renderFilePreview(file)}
                  <input
                    type="text"
                    className="text-sm bg-transparent border-b border-dotted border-gray-500 focus:outline-none text-gray-300"
                    value={file.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFileAttachments(prev =>
                        prev.map(f => f.id === file.id ? { ...f, name: newName } : f)
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-1"
            >
              <Save size={18} /> Save Trip
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trips.map(trip => (
          <div key={trip.id} className="bg-gray-800 p-4 rounded space-y-2">
            <h3 className="text-xl font-bold">{trip.from} to {trip.to}</h3>
            <p className="text-sm">Departure: {new Date(trip.departureDate).toLocaleDateString()}</p>
            {trip.returnDate && (
              <p className="text-sm">Return: {new Date(trip.returnDate).toLocaleDateString()}</p>
            )}
            {trip.transport && <p className="text-sm">Transport: {trip.transport}</p>}
            {trip.ticketCost && <p className="text-sm">Ticket Cost: {trip.ticketCost}</p>}
            {trip.hotelName && <p className="text-sm">Hotel: {trip.hotelName}</p>}
            {trip.hotelLink && (
              <a
                href={trip.hotelLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline text-sm"
              >
                Hotel Link
              </a>
            )}
            {trip.totalCost && <p className="text-sm">Total Cost: {trip.totalCost}</p>}
            {trip.notes && <p className="text-sm">Notes: {trip.notes}</p>}
            {trip.files.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-semibold">Attachments:</p>
                {trip.files.map(file => (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2"
                  >
                    {renderFilePreview(file)}
                    <span className="text-blue-400 underline text-sm">{file.name}</span>
                  </a>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
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
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this trip?")) {
                    deleteTrip(trip.id);
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TravelPlanner;
