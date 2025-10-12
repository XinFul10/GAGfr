import React, { useMemo, useState } from 'react'
import './calendar.css'
import { useNavigate } from 'react-router-dom'

// Accessible responsive monthly calendar
export default function Calendar({ user }) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const navigate = useNavigate()

  const { year, monthIndex, monthName, weeks } = useMemo(() => buildCalendar(viewDate), [viewDate])

  function handlePrevMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  function handleNextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }
  function handleToday() {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  return (
    <div className="cal-page">
      <div className="cal-top" style={{maxWidth: '960px', margin: '0 auto 8px', display: 'flex'}}>
        <button className="cal-nav" aria-label="Back to dashboard" title="Back" onClick={() => navigate('/')}>⟵</button>
      </div>
      <header className="cal-header">
        <button className="cal-nav" aria-label="Previous month" onClick={handlePrevMonth}>←</button>
        <div className="cal-title" aria-live="polite" aria-atomic>{monthName} {year}</div>
        <button className="cal-nav" aria-label="Next month" onClick={handleNextMonth}>→</button>
      </header>

      <div className="cal-controls">
        <button className="btn today" onClick={handleToday} aria-label="Go to today">Today</button>
      </div>

      <section className="calendar" role="grid" aria-labelledby="monthLabel">
        <div id="monthLabel" className="sr-only">{monthName} {year}</div>
        <div className="cal-week cal-weekdays" role="row">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
            <div key={d} role="columnheader" className="cal-cell cal-head" aria-label={d}>{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="cal-week" role="row">
            {week.map((day, di) => (
              <DayCell key={`${wi}-${di}`} day={day} isToday={isSameDate(day.date, today)} isCurrentMonth={day.inCurrentMonth} />
            ))}
          </div>
        ))}
      </section>

      <footer className="cal-legend">
        <div className="legend-item"><span className="dot work" /> Work Days</div>
        <div className="legend-item"><span className="dot seminar" /> Seminar Days</div>
      </footer>
    </div>
  )
}

function DayCell({ day, isToday, isCurrentMonth }) {
  const ariaLabel = `${day.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}${isToday ? ', today' : ''}`
  return (
    <button
      role="gridcell"
      aria-label={ariaLabel}
      className={`cal-cell cal-day ${isCurrentMonth ? '' : 'muted'} ${isToday ? 'today' : ''}`}
      tabIndex={isToday ? 0 : -1}
    >
      <span className="date-num">{day.date.getDate()}</span>
    </button>
  )
}

function buildCalendar(anchor) {
  const year = anchor.getFullYear()
  const monthIndex = anchor.getMonth() // 0-11
  const monthName = anchor.toLocaleString(undefined, { month: 'long' }).toUpperCase()

  const first = new Date(year, monthIndex, 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay()) // back to Sunday

  const weeks = []
  let cursor = new Date(start)
  for (let w = 0; w < 6; w++) {
    const row = []
    for (let d = 0; d < 7; d++) {
      const inCurrentMonth = cursor.getMonth() === monthIndex
      row.push({ date: new Date(cursor), inCurrentMonth })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(row)
  }
  return { year, monthIndex, monthName, weeks }
}

function isSameDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
