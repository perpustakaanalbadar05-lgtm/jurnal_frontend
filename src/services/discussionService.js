import api from './api'

export const discussionService = {
  async list(paperId) {
    const { data } = await api.get(`/papers/${paperId}/discussions`)
    return data
  },

  async send(paperId, message) {
    const { data } = await api.post(`/papers/${paperId}/discussions`, { message })
    return data
  },
}
