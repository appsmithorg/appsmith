def count_substring(string, sub_string):
    count =0
    for i in range(len(string)-len(sub_string)+1):
        try:
            if string[i:i+len(sub_string)]==sub_string:
                count+=1
        except IndexError:
            break
    return count

if __name__ == '__main__':
    string = input().strip()
    sub_string = input().strip()
    
    count = count_substring(string, sub_string)
    print(count)
