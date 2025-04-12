// src/test/ProjectTracker.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProjectTracker from '../components/trackers/ProjectTracker'
import { vi } from 'vitest'

// Мокаем Firebase (auth и db)
vi.mock('../../firebaseConfig', () => ({
  auth: { currentUser: { uid: 'test-user-id' } },
  db: {}
}))

// Мокаем Firestore API
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore') as any
  return {
    ...actual,
    addDoc: vi.fn(() => Promise.resolve({ id: 'mock-id' })),
    collection: vi.fn(),
    doc: vi.fn(() => 'mockDocRef'), // возвращаем фиктивный документный референс
    updateDoc: vi.fn(() => Promise.resolve()),
    getDocs: vi.fn(() => Promise.resolve({ forEach: () => {} })),
    query: vi.fn(),
    where: vi.fn()
  }
})

import { addDoc, updateDoc } from 'firebase/firestore'

describe('🔥 ProjectTracker — полный интеграционный тест', () => {
  it('проходит через все ключевые действия с проектом', async () => {
    render(<ProjectTracker />)

    // 1. Нажимаем кнопку "Add new project"
    const addButton = screen.getByRole('button', { name: /add new project/i })
    fireEvent.click(addButton)

    // 2. Находим input с "Project Name" и проверяем, что он отобразился
    const nameInput = await screen.findByDisplayValue(/project name/i)
    expect(nameInput).toBeInTheDocument()
    expect(addDoc).toHaveBeenCalled()

    // 3. Изменяем имя проекта на "React App"
    fireEvent.change(nameInput, { target: { value: 'React App' } })
    fireEvent.blur(nameInput)
    await waitFor(() => {
      const updateCalls = (updateDoc as any).mock.calls
      expect(updateCalls[0][0]).toEqual('mockDocRef')
      expect(updateCalls[0][1]).toEqual(expect.objectContaining({ name: 'React App' }))
    })

    // 4. Изменяем уровень сложности: выбираем 5-й уровень (значение 5)
    const difficultyCircles = screen.getAllByTitle(/level of difficulty/i)
    fireEvent.click(difficultyCircles[4])
    await waitFor(() => {
      const updateCalls = (updateDoc as any).mock.calls
      // Второй вызов обновляет сложность
      expect(updateCalls[1][0]).toEqual('mockDocRef')
      expect(updateCalls[1][1]).toEqual(expect.objectContaining({ difficulty: 5 }))
    })

    // 5. Добавляем задачу (milestone)
    const addTaskButton = screen.getAllByLabelText(/add task/i)[0]
    fireEvent.click(addTaskButton)
    // Ждем появления инпута с "New Task"
    const newTaskInput = await screen.findByDisplayValue(/new task/i)
    expect(newTaskInput).toBeInTheDocument()
    await waitFor(() => {
      const updateCalls = (updateDoc as any).mock.calls
      // Третий вызов — обновление milestones с новой задачей
      expect(updateCalls[2][0]).toEqual('mockDocRef')
      expect(updateCalls[2][1]).toEqual(expect.objectContaining({
        milestones: expect.arrayContaining([
          expect.objectContaining({ name: 'New Task', completed: false })
        ])
      }))
    })

    // 6. Отмечаем задачу как выполненную
    // Предполагаем, что задача рендерится с checkbox
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    await waitFor(() => {
      const updateCalls = (updateDoc as any).mock.calls
      // Четвертый вызов — обновление: задача выполнена и статус обновлен на "Done"
      expect(updateCalls[3][0]).toEqual('mockDocRef')
      expect(updateCalls[3][1]).toEqual(expect.objectContaining({
        milestones: expect.arrayContaining([
          expect.objectContaining({ name: 'New Task', completed: true })
        ]),
        status: 'Done'
      }))
    })

    // 7. Добавляем заметку (note)
    const noteInput = screen.getByPlaceholderText(/comment/i)
    fireEvent.change(noteInput, { target: { value: 'This is a test note' } })
    fireEvent.keyDown(noteInput, { key: 'Enter', code: 'Enter' })
    await waitFor(() => {
      const updateCalls = (updateDoc as any).mock.calls
      // Проверяем, что заметка присутствует среди обновлений
      expect(updateCalls.some((call: any) =>
        call[1] && call[1].notes && call[1].notes.some((n: any) => n.text === 'This is a test note')
      )).toBeTruthy()
    })

    // 8. Переключаем избранное (favorite) — делаем это до архивирования
    const favoriteButton = screen.getByLabelText(/toggle favorite/i)
    fireEvent.click(favoriteButton)
    await waitFor(() => {
      const updateCalls = (updateDoc as any).mock.calls
      expect(updateCalls.some((call: any) =>
        call[1] && call[1].favorite === true
      )).toBeTruthy()
    })

    // 9. Архивируем проект
    const archiveButton = screen.getByLabelText(/toggle archive/i)
    fireEvent.click(archiveButton)
    await waitFor(() => {
      const updateCalls = (updateDoc as any).mock.calls
      expect(updateCalls.some((call: any) =>
        call[1] && call[1].archived === true
      )).toBeTruthy()
    })

    // Итоговая проверка — обернем в waitFor для асинхронного обновления:
    await waitFor(() => {
      expect(screen.getByDisplayValue(/react app/i)).toBeInTheDocument()
      expect(screen.getByText(/done/i)).toBeInTheDocument()
      expect(screen.getByText(/this is a test note/i)).toBeInTheDocument()
    })
  })
})
