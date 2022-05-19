export default (client) => {
  return {
    fetchAll() {
      return client.get('/custom/group/')
    },
    order(order) {
      return client.post('/groups/order/', {
        groups: order,
      })
    },
    create(values) {
      return client.post('/custom/group/', values)
    },
    update(id, values) {
      return client.patch(`/custom/group/${id}/`, values)
    },
    leave(id) {
      return client.post(`/groups/${id}/leave/`)
    },
    delete(id) {
      return client.delete(`/custom/group/${id}/`)
    },
    sendInvitation(groupId, baseUrl, values) {
      values.base_url = baseUrl
      return client.post(`/groups/invitations/group/${groupId}/`, values)
    },
    fetchAllUsers(groupId) {
      return client.get(`/groups/users/group/${groupId}/`)
    },
    updateUser(groupUserId, values) {
      return client.patch(`/groups/users/${groupUserId}/`, values)
    },
    deleteUser(groupUserId) {
      return client.delete(`/groups/users/${groupUserId}/`)
    },
    fetchAllInvitations(groupId) {
      return client.get(`/groups/invitations/group/${groupId}/`)
    },
    fetchInvitationByToken(token) {
      return client.get(`/groups/invitations/token/${token}/`)
    },
    updateInvitation(invitationId, values) {
      return client.patch(`/groups/invitations/${invitationId}/`, values)
    },
    deleteInvitation(invitationId) {
      return client.delete(`/groups/invitations/${invitationId}/`)
    },
    rejectInvitation(invitationId) {
      return client.post(`/groups/invitations/${invitationId}/reject/`)
    },
    acceptInvitation(invitationId) {
      return client.post(`/groups/invitations/${invitationId}/accept/`)
    },
  }
}
