import { Router } from 'express';
import { createContact, deleteContact, getContactById, listContacts, updateContact } from '../lib/contact-store';
import { adminAuth } from '../middleware/auth';
import { ContactRecord } from '../types/domain';
import { createObjectIdLike } from '../utils/ids';

const router = Router();

router.post('/', (req, res) => {
  const { name, email, phone, subject, message } = req.body ?? {};

  if (!name || !email || !phone || !subject || !message) {
    res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
    return;
  }

  const timestamp = new Date().toISOString();
  const contact: ContactRecord = {
    id: createObjectIdLike(),
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    phone: String(phone).trim(),
    subject: String(subject).trim(),
    message: String(message).trim(),
    status: 'new',
    createdAt: timestamp,
    updatedAt: timestamp
  };

  createContact(contact);

  res.status(201).json({
    success: true,
    message: 'Message sent successfully. We will get back to you soon.',
    contact
  });
});

router.get('/', adminAuth, (_req, res) => {
  const messages = listContacts();
  res.status(200).json({
    success: true,
    count: messages.length,
    messages
  });
});

router.get('/:id', adminAuth, (req, res) => {
  const contact = getContactById(req.params.id);

  if (!contact) {
    res.status(404).json({
      success: false,
      message: 'Contact message not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    contact
  });
});

router.put('/:id', adminAuth, (req, res) => {
  const contact = updateContact(req.params.id, String(req.body?.status || 'new'), new Date().toISOString());

  if (!contact) {
    res.status(404).json({
      success: false,
      message: 'Contact message not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Contact message updated successfully',
    contact
  });
});

router.delete('/:id', adminAuth, (req, res) => {
  if (!deleteContact(req.params.id)) {
    res.status(404).json({
      success: false,
      message: 'Contact message not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Contact message deleted successfully'
  });
});

export default router;
