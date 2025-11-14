import React, { useState } from 'react'
import './BugSubmissionForm.css'

function BugSubmissionForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium',
    companyName: '',
    reporterEmail: '',
    bountyAmount: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
    // Reset form
    setFormData({
      title: '',
      description: '',
      severity: 'medium',
      companyName: '',
      reporterEmail: '',
      bountyAmount: ''
    })
  }

  return (
    <form className="bug-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="title">Bug Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="Brief description of the bug"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows="5"
          placeholder="Detailed description of the vulnerability..."
        />
      </div>

      <div className="form-group">
        <label htmlFor="severity">Severity *</label>
        <select
          id="severity"
          name="severity"
          value={formData.severity}
          onChange={handleChange}
          required
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="companyName">Company Name *</label>
        <input
          type="text"
          id="companyName"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          required
          placeholder="Target company name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="reporterEmail">Your Email *</label>
        <input
          type="email"
          id="reporterEmail"
          name="reporterEmail"
          value={formData.reporterEmail}
          onChange={handleChange}
          required
          placeholder="your.email@example.com"
        />
      </div>

      <div className="form-group">
        <label htmlFor="bountyAmount">Bounty Amount (€)</label>
        <input
          type="number"
          id="bountyAmount"
          name="bountyAmount"
          value={formData.bountyAmount}
          onChange={handleChange}
          placeholder="Expected bounty amount"
          min="0"
        />
      </div>

      <button type="submit" className="submit-btn">Submit Bug Report</button>
    </form>
  )
}

export default BugSubmissionForm
