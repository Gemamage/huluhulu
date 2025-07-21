import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { User, IUser } from '../../src/models/User';
import { Pet } from '../../src/models/Pet';
import { petRoutes } from '../../src/routes/pets';
import { authenticate } from '../../src/middleware/auth';
import { errorHandler } from '../../src/middleware/error-handler';
import { validUserData, otherUserData, validPetData, createTestPet } from '../utils/testData';

// 創建測試應用
const app = express();
app.use(express.json());
app.use('/api/pets', petRoutes);
app.use(errorHandler);

describe('Pet Routes', () => {
  let testUser: IUser;
  let authToken: string;
  let otherUser: IUser;
  let otherAuthToken: string;





  beforeEach(async () => {
    testUser = await new User(validUserData).save();
    authToken = testUser.generateAuthToken();
    
    otherUser = await new User(otherUserData).save();
    otherAuthToken = otherUser.generateAuthToken();
  });

  afterEach(async () => {
    await Pet.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/pets', () => {
    it('should create a new pet with valid data', async () => {
      const response = await request(app)
        .post('/api/pets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validPetData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pet).toBeDefined();
      expect(response.body.data.pet.name).toBe(validPetData.name);
      expect(response.body.data.pet.type).toBe(validPetData.type);
      expect(response.body.data.pet.userId.id).toBe(testUser._id.toString());
    });

    it('should not create pet without authentication', async () => {
      const response = await request(app)
        .post('/api/pets')
        .send(validPetData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error || response.body.message).toBeDefined();
    });

    it('should not create pet with invalid data', async () => {
      const response = await request(app)
        .post('/api/pets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validPetData,
          type: 'invalid-type'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should not create pet with missing required fields', async () => {
      const response = await request(app)
        .post('/api/pets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Buddy'
          // 缺少其他必需字段
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/pets', () => {
    beforeEach(async () => {
      // 創建測試寵物
      await new Pet({
        ...validPetData,
        userId: testUser._id,
        lastSeenDate: new Date('2024-01-15T10:00:00Z')
      }).save();

      await new Pet({
        ...validPetData,
        name: 'Max',
        breed: 'Labrador',
        type: 'dog',
        status: 'found',
        userId: testUser._id,
        lastSeenDate: new Date('2024-01-16T14:30:00Z')
      }).save();

      await new Pet({
        ...validPetData,
        name: 'Whiskers',
        breed: 'Persian',
        type: 'cat',
        status: 'lost',
        userId: otherUser._id,
        lastSeenDate: new Date('2024-01-17T09:15:00Z')
      }).save();
    });

    it('should get all pets without filters', async () => {
      const response = await request(app)
        .get('/api/pets')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pets).toBeDefined();
      expect(response.body.data.pets.length).toBeGreaterThan(0);
      expect(response.body.data.pagination.totalItems).toBeGreaterThan(0);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.itemsPerPage).toBeDefined();
    });

    it('should filter pets by type', async () => {
      const response = await request(app)
        .get('/api/pets?type=dog')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.pets.forEach((pet: any) => {
        expect(pet.type).toBe('dog');
      });
    });

    it('should filter pets by status', async () => {
      const response = await request(app)
        .get('/api/pets?status=lost')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.pets.forEach((pet: any) => {
        expect(pet.status).toBe('lost');
      });
    });

    it('should filter pets by breed', async () => {
      const response = await request(app)
        .get('/api/pets?breed=Golden Retriever')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.pets.forEach((pet: any) => {
        expect(pet.breed).toBe('Golden Retriever');
      });
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/pets?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pets.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.itemsPerPage).toBe(2);
    });

    it('should sort results', async () => {
      const response = await request(app)
        .get('/api/pets?sortBy=createdAt&sortOrder=desc')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      if (response.body.data.pets.length > 1) {
        const dates = response.body.data.pets.map((pet: any) => new Date(pet.createdAt).getTime());
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i-1]).toBeGreaterThanOrEqual(dates[i]);
        }
      }
    });
  });

  describe('GET /api/pets/:id', () => {
    let testPet: any;

    beforeEach(async () => {
      testPet = await new Pet({
        ...validPetData,
        userId: testUser._id
      }).save();
    });

    it('should get pet by valid ID', async () => {
      const response = await request(app)
        .get(`/api/pets/${testPet._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pet).toBeDefined();
      expect(response.body.data.pet._id).toBe(testPet._id.toString());
      expect(response.body.data.pet.name).toBe(testPet.name);
    });

    it('should increment view count when getting pet', async () => {
      const originalViewCount = testPet.viewCount;
      
      await request(app)
        .get(`/api/pets/${testPet._id}`)
        .expect(200);
      
      const updatedPet = await Pet.findById(testPet._id);
      expect(updatedPet?.viewCount).toBe(originalViewCount + 1);
    });

    it('should not get pet with invalid ID', async () => {
      const response = await request(app)
        .get('/api/pets/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBeDefined();
    });

    it('should not get non-existent pet', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/pets/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBeDefined();
    });
  });

  describe('PUT /api/pets/:id', () => {
    let testPet: any;

    beforeEach(async () => {
      testPet = await new Pet({
        ...validPetData,
        userId: testUser._id
      }).save();
    });

    it('should update pet by owner', async () => {
      const updateData = {
        name: 'Updated Buddy',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/pets/${testPet._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pet.name).toBe(updateData.name);
      expect(response.body.data.pet.description).toBe(updateData.description);
    });

    it('should not update pet without authentication', async () => {
      const response = await request(app)
        .put(`/api/pets/${testPet._id}`)
        .send({ name: 'Updated' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBeDefined();
    });

    it('should not update pet by non-owner', async () => {
      const response = await request(app)
        .put(`/api/pets/${testPet._id}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .send({ name: 'Updated' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBeDefined();
    });

    it('should not update pet with invalid data', async () => {
      const response = await request(app)
        .put(`/api/pets/${testPet._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'invalid-type' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error || response.body.message).toBeDefined();
    });
  });

  describe('DELETE /api/pets/:id', () => {
    let testPet: any;

    beforeEach(async () => {
      testPet = await new Pet({
        ...validPetData,
        userId: testUser._id
      }).save();
    });

    it('should delete pet by owner', async () => {
      const response = await request(app)
        .delete(`/api/pets/${testPet._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('寵物協尋案例已刪除');
      
      const deletedPet = await Pet.findById(testPet._id);
      expect(deletedPet).toBeNull();
    });

    it('should not delete pet without authentication', async () => {
      const response = await request(app)
        .delete(`/api/pets/${testPet._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should not delete pet by non-owner', async () => {
      const response = await request(app)
        .delete(`/api/pets/${testPet._id}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/pets/:id/share', () => {
    let testPet: any;

    beforeEach(async () => {
      testPet = await new Pet({
        ...validPetData,
        userId: testUser._id
      }).save();
    });

    it('should increment share count', async () => {
      const originalShareCount = testPet.shareCount;
      
      const response = await request(app)
        .post(`/api/pets/${testPet._id}/share`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const updatedPet = await Pet.findById(testPet._id);
      expect(updatedPet?.shareCount).toBe(originalShareCount + 1);
    });

    it('should not increment share count for invalid ID', async () => {
      const response = await request(app)
        .post('/api/pets/invalid-id/share')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/pets/user/:userId', () => {
    beforeEach(async () => {
      await new Pet({
        ...validPetData,
        userId: testUser._id
      }).save();

      await new Pet({
        ...validPetData,
        name: 'Max',
        userId: testUser._id
      }).save();
    });

    it('should get pets for valid user', async () => {
      const response = await request(app)
        .get(`/api/pets/user/${testUser._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pets).toBeDefined();
      expect(response.body.data.pets.length).toBeGreaterThan(0);
      response.body.data.pets.forEach((pet: any) => {
        expect(pet.userId._id.toString()).toBe(testUser._id.toString());
      });
    });

    it('should return empty array for user with no pets', async () => {
      const response = await request(app)
        .get(`/api/pets/user/${otherUser._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pets).toBeDefined();
      expect(response.body.data.pets.length).toBe(0);
    });

    it('should not get pets for invalid user ID', async () => {
      const response = await request(app)
        .get('/api/pets/user/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});