import config from '../../config/config.js';

// Safety guard for collection-wide DELETE (only for disposable local test data).
// Every collection-wide DELETE must also pass requireSignin in its route.
const allowBulkDelete = (req, res, next) => {
  if (config.env !== 'development' || !config.allowBulkDelete) {
    return res.status(403).json({ error: 'Bulk delete is disabled. Enable it only for disposable local test data.' });
  }
  if (req.get('X-Confirm-Delete-All') !== 'DELETE ALL') {
    return res.status(400).json({ error: 'Set X-Confirm-Delete-All: DELETE ALL to confirm this destructive test.' });
  }
  next();
};

export default allowBulkDelete;
