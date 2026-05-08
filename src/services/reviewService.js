import api from './api'

export const reviewService = {
  async getForPaper(paperId) {
    const { data } = await api.get(`/papers/${paperId}/reviews`)
    return data
  },

  async submit(formData) {
    const { data } = await api.post('/reviews', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async update(id, reviewData) {
    const { data } = await api.put(`/reviews/${id}`, reviewData)
    return data
  },

  async getMyQueue() {
    const { data } = await api.get('/my-review-queue')
    return data
  },

  async getMyHistory() {
    const { data } = await api.get('/my-review-history')
    return data
  },

  async download(reviewId, fileName = 'revised_document.docx') {
    const response = await api.get(`/reviews/${reviewId}/download`, {
      responseType: 'blob',
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  async downloadWord(reviewId, fileName = 'revised_document.docx') {
    const response = await api.get(`/reviews/${reviewId}/download-word`, {
      responseType: 'blob',
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
