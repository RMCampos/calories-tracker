import { Client, Account, Databases, Query } from 'appwrite';
import { FoodStorage } from './types';

// Initialize Appwrite client
const client = new Client();

client
    .setEndpoint('https://cloud.appwrite.io/v1') // Your Appwrite endpoint
    .setProject("684ac3bf000ee8950f5a"); // Replace with your project ID

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);

// Configuration constants
export const DATABASE_ID = '684b38db000fac8c781c'; // Replace with your database ID
export const FOOD_ENTRIES_COLLECTION_ID = '684b38e300336fc605dc'; // Replace with your collection ID

// Auth helper functions
export class AppwriteAuth {
  // Register new user
  static async register(email: string, password: string, name: string) {
    try {
      const response = await account.create('unique()', email, password, name);
      console.debug('User registered:', response);
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  static async login(email: string, password: string) {
    try {
      const session = await account.createEmailPasswordSession(email, password);
      console.debug('User logged in:', session);
      return session;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout user
  static async logout() {
    try {
      await account.deleteSession('current');
      console.debug('User logged out');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Get current user
  static async getCurrentUser() {
    try {
      const user = await account.get();
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  // Check if user is logged in
  static async isLoggedIn() {
    try {
      await account.get();
      return true;
    } catch {
      return false;
    }
  }
}

// Database helper functions
export class AppwriteDB {
  // Save food entry
  static async saveFoodEntry(entryData: FoodStorage) {
    try {
      const response = await databases.createDocument(
          DATABASE_ID,
          FOOD_ENTRIES_COLLECTION_ID,
          'unique()',
          {
              ...entryData,
              userId: (await account.get()).$id,
              createdAt: new Date().toISOString()
          }
      );
      console.debug('Food entry saved:', response);
      return response;
    } catch (error) {
      console.error('Save food entry error:', error);
      throw error;
    }
  }

  // Get user's food entries for a specific date
  static async getFoodEntries(date: Date) {
    try {
      const user = await account.get();

      const response = await databases.listDocuments(
        DATABASE_ID,
        FOOD_ENTRIES_COLLECTION_ID,
        [
          Query.equal('userId', user.$id),
          Query.equal('date', date.toISOString().split('T')[0]),
        ]
      );
      console.debug('Food entries retrieved:', response);
      return response.documents;
    } catch (error) {
      console.error('Get food entries error:', error);
      throw error;
    }
  }

  // Delete food entry
  static async deleteFoodEntry(documentId: string) {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        FOOD_ENTRIES_COLLECTION_ID,
        documentId
      );
      console.debug('Food entry deleted:', documentId);
    } catch (error) {
      console.error('Delete food entry error:', error);
      throw error;
    }
  }

  // Get all food entries for a user (for calendar view)
  static async getAllUserEntries() {
    try {
      const user = await account.get();
      const response = await databases.listDocuments(
          DATABASE_ID,
          FOOD_ENTRIES_COLLECTION_ID,
          [Query.equal('userId', user.$id)]
      );
      return response.documents;
    } catch (error) {
      console.error('Get all entries error:', error);
      throw error;
    }
  }
}
