LRU-Cache-Project
What is LRU Cache ?
What is Cache ?
What is applications of LRU cache ?
What data structure do we use to implement LRC cache ?
Implementation
for implementing LRU cache system we first have to know what operations does LRU Cache support. here below are operation that LRU Cache support.

Inerting item into cache
Accessing item from cache.
Accessing most recently used item from cache.
Case - 1
in this case we discuss how can we implement 1st operation that is inserting an item into the LRU Cache.
#include <bits/stdc++.h>
using namespace std;
struct Node
{
    string key;
    int value;
    Node(string a, int data)
    {
        key = a;
        value = data;
    }
};
struct LRU
{
    int cap;
    list<Node> cache;
    unordered_map<string, list<Node>::iterator> m;
    LRU(int size)
    {
        cap = size > 1 ? size : 1;
    }
    // Inserting key into cache
    void InsertKey(string key, int value)
    {
        if (m.find(key) == m.end())
        {
            //case where cache is full
            if (m.size() == cap)
            {
                //storing last node value
                Node last_node = cache.back();
                //removing last node from hashtable
                m.erase(last_node.key);
                // removing last node from linked list
                cache.pop_back();
            }

            Node temp(key, value);
            cache.push_front(temp);
            m[key] = cache.begin();
        }
        else
        {
            // case where case hit happens
            //updating the value
            auto it = m[key];
            it->value = value;
        }
    }
    // geting value for a given key
    int *getValue(string key)
    {
        if (m.find(key) != m.end())
        {
            auto it = m[key];
            int value = it->value;
            // updating sequence because now this key becomes recently used key
            cache.push_front(*it);
            cache.erase(it);
            // updating hashmap key address
            m[key] = cache.begin();
            return &cache.begin()->value;
        }
        return NULL;
    }
    // getting most recent key
    string mostRecentKey()
    {
        return cache.front().key;
    }
};

char greet()
{
    cout << "<<<<<<---- Menu ---->>>>>>" << endl;
    cout << "1.insert key " << endl;
    cout << "2.get value" << endl;
    cout << "3.get most recent key\n"
         << endl;

    cout << "Options Available...." << endl;
    cout << "1. enter A for inserting key" << endl;
    cout << "2. enter B for getting key's value" << endl;
    cout << "3. enter C for getting most recent key" << endl;
    char c;
    cout << "Enter your choice : ";
    cin >> c;
    return c;
}
int main()
{
    int size;
    cout << "Enter your lru cache size : ";
    cin >> size;
    LRU lru(size);
    bool state = true;
    cout << endl;
    while (state)
    {
        char choice = greet();
        if (choice == 'A')
        {
            string key;
            cout << "Enter key to be insert : ";
            cin >> key;
            int value;
            cout << "Enter value :";
            cin >> value;
            lru.InsertKey(key, value);
        }
        else if (choice == 'B')
        {
            string key;
            cout << "Enter Key :";
            cin >> key;
            int *val = lru.getValue(key);
            if (val == NULL)
            {
                cout << "Key does not exist in the cache." << endl;
            }
            cout << key << " --> " << *val << endl;
        }
        else
        {
            cout << "Most recent key in the cache : " << lru.mostRecentKey() << endl;
        }
        char c;
        cout << "\t !!!!! if do you want to come out of this system press T else press F !!!!!" << endl;
        cin >> c;

        if (c == 'T')
        {
            state = false;
        }
        else
        {
            state = true;
        }
        cout << endl;
    }
    return 0;
}
