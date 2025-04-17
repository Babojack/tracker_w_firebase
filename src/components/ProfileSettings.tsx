import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import {
  updateProfile,
  updateEmail,
  updatePassword,
  signOut,
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storage = getStorage();

const ProfileSettings: React.FC = () => {
  const user = auth.currentUser;
  if (!user) return <p className="text-white">Пользователь не авторизован</p>;

  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoFile(file);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let newPhotoURL = photoURL;

      if (photoFile) {
        const storageRef = ref(storage, `profile_photos/${user.uid}/${photoFile.name}`);
        await uploadBytes(storageRef, photoFile);
        newPhotoURL = await getDownloadURL(storageRef);
      }

      await updateProfile(user, { displayName, photoURL: newPhotoURL });

      if (email !== user.email) await updateEmail(user, email);
      if (password) await updatePassword(user, password);

      setPhotoURL(newPhotoURL);
      setSuccess('Профиль успешно обновлён!');
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-gray-800 text-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">Настройки профиля</h2>

      {error && <p className="text-red-400 mb-2">{error}</p>}
      {success && <p className="text-green-400 mb-2">{success}</p>}

      <div className="mb-4">
        <label className="block mb-1">Фото профиля</label>
        {photoURL && <img src={photoURL} alt="profile" className="w-24 h-24 rounded-full mb-2" />}
        <input type="file" accept="image/*" onChange={handlePhotoChange} />
      </div>

      <div className="mb-4">
        <label className="block mb-1">Имя</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full p-2 rounded bg-gray-700"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded bg-gray-700"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1">Новый пароль</label>
        <input
          type="password"
          placeholder="Оставьте пустым, если не менять"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-gray-700"
        />
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
        >
          {loading ? 'Сохранение…' : 'Сохранить'}
        </button>

        <button
          onClick={() => signOut(auth)}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
        >
          Выйти
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
