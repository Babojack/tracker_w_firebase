import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GoalTracker from '../components/trackers/GoalsTracker'
import { vi } from 'vitest'

// Мокаем auth и db из firebaseConfig
vi.mock('../../firebaseConfig', () => ({
  auth: { currentUser: { uid: 'test-user-id' } },
  db: {}
}))

// Мокаем Firestore методы
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore') as any
  return {
    ...actual,
    addDoc: vi.fn(() => Promise.resolve({ id: 'mock-id' })),
    collection: vi.fn(),
    doc: vi.fn(() => 'mockDocRef'),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    getDocs: vi.fn(() => Promise.resolve({ forEach: () => {} })),
    query: vi.fn(),
    where: vi.fn()
  }
})

import { addDoc, updateDoc } from 'firebase/firestore'

describe('GoalTracker — полный интеграционный тест', () => {
  it('проходит через основные сценарии работы с целями', async () => {
    render(<GoalTracker />)

    // 1) Добавление новой цели
    const addButton = screen.getByRole('button', { name: /add new goal/i })
    fireEvent.click(addButton)

    // Проверяем, что addDoc был вызван и новая цель "New Goal" появилась
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled()
    })

    // Ждём появления input со значением "New Goal"
    const nameInput = await screen.findByDisplayValue(/new goal/i)
    expect(nameInput).toBeInTheDocument()

    // 2) Редактирование имени цели
    fireEvent.change(nameInput, { target: { value: 'My Updated Goal' } })
    // Потеря фокуса (onBlur) или Enter — зависит от твоей логики
    fireEvent.blur(nameInput)
    // Проверяем, что updateDoc вызван с новым именем
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        'mockDocRef',
        expect.objectContaining({ name: 'My Updated Goal' })
      )
    })

    // 3) Изменение сложности (Difficulty)
    // Находим все кружочки (title="Priority Level X"). Выбираем, например, 5-ый кружок
    const difficultyCircles = screen.getAllByTitle(/priority level/i)
    // Для значения "5" это будет индекс 4
    fireEvent.click(difficultyCircles[4])
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        'mockDocRef',
        expect.objectContaining({ difficulty: 5 })
      )
    })

    // 4) Добавление задачи (milestone)
    // Ищем кнопку "Add task" – в коде aria-label="Add task"
    const addTaskButtons = screen.getAllByLabelText(/add task/i)
    // Берём первый, если целей несколько:
    fireEvent.click(addTaskButtons[0])
    // Проверим, что после добавления появилась задача "New Task"
    const newTaskInput = await screen.findByDisplayValue(/new task/i)
    expect(newTaskInput).toBeInTheDocument()
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        'mockDocRef',
        expect.objectContaining({
          milestones: expect.arrayContaining([
            expect.objectContaining({ name: 'New Task', completed: false })
          ])
        })
      )
    })

    // 5) Отмечаем задачу выполненной
    // Предположим, у тебя есть checkbox для переключения completed
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        'mockDocRef',
        expect.objectContaining({
          milestones: expect.arrayContaining([
            expect.objectContaining({ completed: true })
          ]),
          status: 'Done' // или "In Progress", в зависимости от логики
        })
      )
    })

    // 6) Добавляем заметку (Note)
    const noteInput = screen.getByPlaceholderText(/comments/i)
    fireEvent.change(noteInput, { target: { value: 'A new note' } })
    // Нажимаем Enter, чтоб сохранить (если у тебя такая логика)
    fireEvent.keyDown(noteInput, { key: 'Enter', code: 'Enter' })
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        'mockDocRef',
        expect.objectContaining({
          notes: expect.arrayContaining([
            expect.objectContaining({ text: 'A new note' })
          ])
        })
      )
    })

    // 7) Добавляем в избранное (favorite)
    const favoriteButton = screen.getByLabelText(/toggle favorite/i)
    fireEvent.click(favoriteButton)
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        'mockDocRef',
        expect.objectContaining({ favorite: true })
      )
    })

    // 8) Архивируем цель
    const archiveButton = screen.getByLabelText(/toggle archive/i)
    fireEvent.click(archiveButton)
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        'mockDocRef',
        expect.objectContaining({ archived: true })
      )
    })
  })
})
